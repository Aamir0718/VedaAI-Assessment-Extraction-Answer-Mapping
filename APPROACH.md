# Approach

A teacher uploads a question paper and a handwritten answer sheet. The app
tells them, per question: **was it answered, where on the sheet, and — if
grading is requested — how well.** Everything below is in service of that
one sentence; nothing here is a feature added because it was easy to build.

For deeper file-by-file detail than fits here, see [README.md](./README.md)
(architecture, setup, deployment) and [context.md](./context.md) (a running,
milestone-by-milestone log — including real bugs found by actually running
the app, not just by reading the code).

## Approach

### Deterministic code vs. the LLM — where each is actually used

The default assumption going in was **"write code first; reach for the
LLM only where code genuinely can't do the job."** In practice that means
most of what the app does — question parsing, marks/total detection,
choice-group linking, three of the four answer-mapping strategies,
coordinate math, confidence scoring, every status label in the UI,
validation, and error handling — is ordinary deterministic TypeScript with
no model call involved at all. The LLM (Gemini) is used narrowly, only
where there's genuinely no deterministic alternative:

| Task | How it's actually done |
|---|---|
| Parse the question paper (numbering, text, marks, choice groups) | **Deterministic** — regex parser (`lib/extraction/question-parser.ts`); this is the path taken for any paper with a real text layer, i.e. most of them |
| …when the paper has no text layer (scanned) or the parser found nothing | LLM fallback only — same detection logic, re-implemented in the prompt for parity |
| Transcribe handwritten answers + locate them on the page | **LLM, always** — there's no deterministic way to read handwriting; this is the one step AI is doing genuinely load-bearing work |
| Map an answer to its question — explicit label / normalized label / positional order | **Deterministic** — 3 of the 4 mapping strategies, checked first, and enough on their own for the large majority of real answer sheets |
| Map an answer to its question — whatever's left after the above | LLM, batched — one call for the remainder, never per-answer |
| Convert a bounding box to on-screen pixels for highlighting | **Deterministic** — one pure function, unit-tested, zero model involvement |
| Decide Unanswered / Needs review / Unmatched / a mark | **Deterministic** — derived from mapping method + confidence, not asked of the model |
| Grade an answer (marks + feedback) | LLM, batched, **optional** — only runs if the teacher explicitly clicks "Grade with AI" |
| File validation, error messages, streaming progress, all UI state | **Deterministic**, throughout |

So of the five things the app visibly does — read the question paper, read
the answer sheet, map answers to questions, highlight them, and grade —
the LLM is the *only* way to do exactly two (reading handwriting, and
grading), and even the mapping/parsing steps it touches at all only see it
as a last resort after three separate deterministic passes have already
had a chance to resolve things correctly. The full reasoning behind each
individual piece is in the sections below.

### Pipeline

```
Question paper ──► deterministic parser (regex, printed-text PDFs)
                    │  falls back to Gemini vision only if there's no
                    │  usable embedded text, or the parser found nothing
                    ▼
                 Question[]  (number, text, maxMarks, choiceGroup)

Answer sheet ───► one Gemini vision call
                    ▼
                 Answer[]  (transcribed text + normalized bounding box)

Question[] + Answer[] ──► deterministic-first mapping
                    ▼
                 AnswerMapping[]  (method + confidence, one per answer)

(optional) ─────► one batched Gemini call, re-reading the real handwriting
                    ▼
                 Evaluation[]  (marks + feedback, clamped to printed max)
```

Every stage streams a progress event to the UI (`POST /api/process`,
NDJSON) — the teacher sees "Reading answer sheet", "Mapping answers", etc.,
never a generic spinner.

### Question extraction

A regex-driven parser (`lib/extraction/question-parser.ts`) handles the
common printed conventions directly — `1.`/`2)`, sub-parts `11(a)`,
`11 (a)`, `11.a`, a table-cell style `Q.1  a.`, roman-numeral sub-parts, and
continuation lines — while preserving the paper's own printed order and
numbering verbatim (never re-sorted). It also picks up each question's
printed marks (`[5]`, `(5 marks)`), a paper-level `"Total Marks: 100"`
header if printed, and links whole alternative questions across a printed
`"OR"` (e.g. `Q1(a)+Q1(b) OR Q2(a)+Q2(b)`) into one choice group, so a
student is scored on whichever side they actually attempted, never both.

This only falls back to a single Gemini vision call when the PDF has no
usable text layer (a scanned/photographed paper) or the parser recognized
zero labels — the AI-fallback prompt is written to detect the exact same
marks/total/choice-group patterns, so the UI behaves identically regardless
of which path a given paper takes.

### Answer extraction and mapping — where highlighting comes from

One Gemini call transcribes the whole answer sheet (single PDF or several
photographed pages, sent as ordered pages in one call) and returns, per
answer, its text plus a bounding box **normalized to 0–1** of the page —
resolution-independent by construction, so the same region is correct
whether it's rendered at 50% zoom or 200%. Pixel conversion for rendering
is one pure function (`lib/pdf/coordinates.ts`), with no PDF/React
knowledge — it's unit-tested in isolation, including a test asserting that
doubling the page size exactly doubles the output rectangle.

Mapping answers to questions is deterministic wherever it can be, and AI
only where it genuinely has to be — checked in priority order per answer:

1. **Explicit label match** against the question's printed number (`"11(a)"` = `"11(a)"`).
2. **Normalized label match** — `Q11(a)`, `11 (a)`, `11.a` all reduce to the same key.
3. **Positional fallback** — *only* fires when the count of still-unlabeled
   answers exactly matches the count of still-unmapped questions. A looser
   version of this heuristic would silently misassign everything after a
   genuinely-skipped question sitting among unlabeled answers, so it's
   deliberately scoped to the one case it can get right for free rather
   than guessing.
4. **Batched AI semantic match** for whatever's left — one call, not one
   per answer — with an explicit instruction to return "unmapped" rather
   than force a guess.

Every mapping carries a `method` and a `confidence`, and an answer that
still can't be mapped is surfaced in the UI as **Unmatched**, never silently
dropped. This is what lets the results screen directly answer the brief's
three questions: a `StatusPill` shows Unanswered / Needs review / Unmatched
/ a real mark, and clicking any question jumps the viewer straight to its
highlighted region (stepping through regions in turn when an answer spans
multiple pages).

### Grading (optional, secondary)

Grading is a separate, explicit "Grade with AI" action — never automatic —
so it never delays mapping/highlighting and never costs an AI call the
teacher didn't ask for. One batched call grades every question with a
confidently-mapped answer, and it's given the **original answer-sheet
file(s)** again, not just the extracted transcription — so it's grading
against the actual handwriting, not compounding any earlier transcription
error. Two defensive details that matter for correctness:

- A returned mark is clamped to `[0, question.maxMarks]` and a hallucinated
  `questionId` outside the batch actually sent is dropped — the model's
  own claims are never trusted past validation.
- Batched calls occasionally omit an item; one bounded retry re-requests
  only what's missing, never a full resend of what already graded fine.

The whole-paper total (`lib/evaluation/total-marks.ts`) prefers the paper's
own printed "Total Marks" when present over a summed total, and for a
choice group sums each alternative's own parts before comparing
alternatives against each other — the real-paper bug that motivated this
(a 5-module choice paper showing 200 instead of 100) is written up in
`context.md`, including the second, subtler bug found only after fixing
the first one.

### UI shell — what's real vs. decorative

The brief asked for one webpage/workflow (upload → extract → map →
highlight → optionally grade), not a multi-tenant classroom platform — but
product experience is explicitly one of the evaluation points, and a bare
single-screen tool reads as less finished than a real product, even when
the underlying functionality is identical. The resolution: the sidebar
(`components/layout/Sidebar.tsx`) gives the app a complete-feeling shell —
Home / My Classroom / Assignments / **Exams** / My Library — but only
**Exams** is real. The other four are static, unclickable labels with no
route, no handler, and no backing data behind them; they exist purely to
make the shell read as a finished product rather than one isolated screen,
not to imply this app does classroom management, assignments, or a library
it was never asked to build and doesn't have. Same reasoning kept the
sidebar's user/school identity, notifications, and an "AI Teaching
Assistant" button that appeared in the visual reference **out** entirely —
inventing a fake logged-in teacher or fake notifications would have crossed
from "make the shell feel complete" into "imply features/data that don't
exist," which is a real product-honesty line worth holding even under a
"design counts" evaluation criterion.

### Architecture

A lean Next.js monolith on purpose — no database, auth, or queues, because
nothing here needs them. The one architectural rule that shapes everything
else: **AI is used only for handwriting perception and genuinely ambiguous
decisions** — question ordering, label normalization, coordinate math,
validation, and all UI state are ordinary deterministic code, not AI calls.
Concretely:

- `lib/ai/` — a single `DocumentAnalyzer` interface behind which every
  Gemini call lives; every response is Zod-schema-validated before
  anything downstream can trust it. Swapping providers means implementing
  one interface, not touching business logic.
- `lib/extraction/`, `lib/mapping/`, `lib/evaluation/`, `lib/pdf/` — each a
  narrow, independently-testable layer with no React/Next.js in it.
- `app/api/process` and `app/api/evaluate` are genuinely separate
  endpoints — grading is optional per the brief, so it's wired as an
  independent call rather than a step that could block the core flow.
- 115 tests (`npm run test`) cover parsing, mapping (one folder per edge
  case — see below), coordinate conversion, and error-message mapping with
  mocked AI output, no network call required. What can't be unit-tested —
  real handwriting-recognition quality — was verified manually against a
  live Gemini key and synthetic fixtures (`context.md`, Milestones 5–7).

## AI model / API used

**Google Gemini** (`@google/generative-ai`), model `gemini-3.6-flash` by
default, configurable via `GEMINI_MODEL`. Used for exactly two things:
transcribing + locating handwritten answers, and (optionally) grading them
— never for anything a deterministic pass can already do correctly.

Why Gemini specifically, for this problem:

- **One model, both modalities.** A single `generateContent` call takes
  the answer-sheet images/PDF directly and returns transcription *and*
  spatial bounding boxes in one pass — no separate OCR engine plus a
  second layout-detection model to keep in sync.
- **Multiple images in one call.** A photographed multi-page answer sheet
  (several images, not one PDF) is sent as ordered inline parts in a
  single request — no client-side PDF assembly needed to keep the AI side
  and the viewer side looking at the same document.
- **Native JSON-mode output**, validated immediately against a Zod schema
  at the one boundary (`lib/ai/client.ts`) every AI call passes through —
  nothing unvalidated ever reaches extraction, mapping, or the UI.
- **Batching-friendly.** Every AI call in this app processes a whole
  document or a whole batch of remaining items in one request — mapping's
  semantic fallback and grading are each exactly one call, never one call
  per question — which keeps both latency and cost close to a small,
  fixed number of calls per submission regardless of how many questions
  the paper has.

## Assumptions and limitations

**Assumptions**

- One question paper and one student's answer sheet per session — this is
  a single-submission tool, not a class-wide batch grader.
- Each document is either one PDF or several photographed page images of
  the same document, never a PDF mixed with images in one upload.
- A question's marks come from what the paper itself prints (`[5]`,
  `(5 marks)`, a "Total Marks" header); if none is printed, it defaults to
  a fixed per-question value rather than inventing a number.
- The printed "OR"-style choice convention is the one form of "answer any
  N of M" instruction handled automatically — free-form prose instructions
  ("attempt any three of the following five") aren't parsed, since regex
  reliably covers the explicit-OR case but not open-ended natural language,
  and reaching for another AI call just to parse instructions would cut
  against minimizing AI usage for something a teacher can also just read.

**Limitations**

- **Handwriting quality depends on Gemini's OCR**, like any AI-based
  transcription — the app surfaces uncertainty (confidence scores, "Needs
  review", "Unmatched") rather than hiding it, but can't fix a genuinely
  illegible scan.
- **No persistence.** Results live in the browser tab for the current
  session only (mirrored to `sessionStorage` so a soft refresh survives,
  but not a closed tab) — by design, since the brief scopes out a
  database; a hard refresh specifically loses the answer-sheet *preview*
  file (no server-side file storage) even though the extracted result
  itself survives.
- **Positional-fallback mapping is intentionally narrow** — it only
  activates when unlabeled-answer count exactly matches remaining-question
  count, so it never risks silently misassigning answers around a
  genuinely skipped question. A looser heuristic would score fewer
  "ambiguous" test cases as ambiguous, at the cost of being wrong exactly
  when it matters most.
- **Free-tier Gemini quota is a real, observed ceiling** during
  development (20 requests/day) — the app's own error handling for this
  (a friendly "AI grading failed" / "couldn't read one of the documents"
  message, never a stack trace) is itself part of what's being submitted,
  not a workaround hiding a gap.
- Grading feedback quality is bounded by the same model call that does the
  grading — it wasn't tuned against a rubric, so treat marks/feedback as a
  strong first pass a teacher reviews, not a final grade.
