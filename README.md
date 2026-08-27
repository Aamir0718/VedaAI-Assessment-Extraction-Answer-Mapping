# VedaAI Assessment Extraction & Answer Mapping

## Overview

A web app that lets a teacher upload a printed question paper and a
handwritten student answer sheet — each either a single PDF or several
photographed page images — then automatically:

- extracts every question in original order and numbering,
- transcribes handwritten answers and locates exactly where each one
  appears on the answer sheet,
- maps answers to questions deterministically wherever possible,
- and lets the teacher click a question to jump straight to the
  highlighted answer region — including across multiple pages.

Grading/feedback is an optional, secondary step that never blocks the core
mapping-and-highlighting workflow.

> Status: feature-complete, built milestone by milestone. See
> [context.md](./context.md) for the full running log — including three
> real bugs found only by actually running the app end to end with a live
> Gemini key, not by reading the code.

## Features

- [x] Upload with file-type/size validation and clear previews — one PDF,
      or multiple photographed pages as separate images, per document
- [x] Real, stage-by-stage processing progress (no generic spinner)
- [x] Deterministic question extraction (printed text), AI fallback for
      image-based/complex layouts
- [x] Handwriting transcription + bounding-box detection via Gemini
- [x] Deterministic-first answer mapping with a confidence model, AI only
      for genuinely ambiguous cases, never a silent drop
- [x] Multi-page answer support with region-by-region navigation
- [x] Click-a-question → jump-to-highlight results viewer
- [x] Optional async grading (marks + feedback), plus a whole-paper total
      score using each question's own printed marks allocation — honoring
      the paper's own "Total Marks: 100" header when printed, and
      "5(a) OR 5(b)"-style choice questions (only the attempted side
      counts, never both)
- [x] Graceful error states — invalid files, corrupt PDFs, AI failures, zero
      questions/answers found — never a raw stack trace in the UI

## Architecture

Lean Next.js monolith — no database, auth, queues, or microservices.

```
Next.js Frontend  →  processAssessment() (application layer)
                          │
        ┌─────────────────┼─────────────────┐
   Extraction           Mapping          Evaluation (optional)
   (PDF parser +        (deterministic   (batched AI call over
    Gemini vision)       + AI fallback)   mapped Q/A pairs)
```

**Core principle:** AI is used only for handwriting perception and genuinely
ambiguous decisions. Question ordering/numbering, label normalization,
obvious mapping, coordinate math, validation, and UI state are all
deterministic code.

## Processing Pipeline

`lib/processing/process-assessment.ts` runs one pipeline per submission:

1. Validate both files.
2. Extract questions (deterministic parser; AI fallback only if the
   document has no usable embedded text). The parser also picks up each
   question's own printed marks allocation (`[5]`, `(10 marks)`, `[2M]`)
   where present, a "Total Marks: 100" style header if the paper prints
   one, and links `"5(a) OR 5(b)"`-style alternatives into a choice group
   so only the attempted side ever counts toward the total.
3. Extract answers — one Gemini call over the full answer sheet (whether
   that's one PDF or several page images sent as ordered pages in the same
   call), returning transcribed text + normalized bounding boxes per region.
4. Map answers to questions (explicit label → normalized label →
   positional heuristic → batched AI semantic fallback → unmapped).
5. Return the `AssessmentResult`. Evaluation, if requested, is a separate
   call afterward and never blocks steps 1–4.

`POST /api/process` streams stage-progress events as this runs, so the UI
can show real progress instead of a spinner.

## AI Strategy

Single provider (Gemini) behind a small `DocumentAnalyzer` interface in
`lib/ai/`, so it can be swapped without touching business logic. AI calls
are batched (one call per document/decision set, never per-question) and
every response is Zod-schema-validated before it's trusted anywhere else in
the app.

## Answer Mapping Strategy

See `lib/mapping/`. Priority order: explicit question-number label →
normalized label variants (`Q11(a)`, `11 (a)`, `11.a`, …) → deterministic
positional fallback → batched AI semantic matching for what's left → a
`confidence` + `method` on every mapping so the UI can distinguish a solid
match from one that needs review, and never hide an unmapped answer.

## Bounding Box / Coordinate Strategy

Answer regions are normalized (`0–1`) `x/y/width/height` per page. Pixel
conversion for rendering is a pure function in `lib/pdf/coordinates.ts`,
kept out of React components entirely.

## Edge Cases

`tests/` mirrors the spec's own list, one folder per case — `basic/`,
`out-of-order/`, `subquestions/`, `unanswered/`, `unmatched/`,
`multi-page/`, `ambiguous/` — each exercising `mapAnswers` end to end with
mocked `Question[]`/`Answer[]` fixtures, no network call. Plus:
missing/unrecognizable question labels (`extract-questions.test.ts`),
a corrupt/non-PDF upload (`pdf-text.test.ts`), and never leaking a raw
error message to the teacher (`to-friendly-message.test.ts`).

## Performance Decisions

- One extraction pass per document — the question paper is read once, the
  answer sheet is sent to Gemini once, never re-sent per question.
- Mapping's AI fallback and grading are each a single batched call over
  every remaining item, not one call per answer/question.
- Deterministic parsing is tried before AI on the question paper, since
  it's usually printed text — AI is a fallback, not the default path.
- Processing streams stage events over one HTTP response instead of
  polling, so the UI shows real progress without extra round-trips.
- Grading is opt-in (a button), not automatic on results load — an AI call
  the teacher didn't ask for is a latency/cost hit with no upside.

## Tech Stack

Next.js (App Router, TypeScript), Tailwind CSS, `lucide-react` icons,
`pdfjs-dist` + `react-pdf` for PDF text extraction/rendering,
`@google/generative-ai` (Gemini) for vision, `zod` for schema validation,
`vitest` for tests.

## Local Setup

```bash
npm install
cp .env.example .env.local   # then add your GEMINI_API_KEY
npm run dev
```

## Environment Variables

See [.env.example](./.env.example).

> **Gotcha:** Next.js loads `.env.local` but never overrides a variable
> that's already set in your shell/OS environment. If AI calls fail with
> an auth error even though `.env.local` looks correct, check for a
> pre-existing system-level `GEMINI_API_KEY` (`printenv GEMINI_API_KEY` on
> macOS/Linux, `[System.Environment]::GetEnvironmentVariable("GEMINI_API_KEY","User")`
> on Windows) shadowing it — remove/update that instead of the `.env.local` value.

## Testing

```bash
npm run typecheck
npm run lint
npm run test
```

70+ tests. Mapping, parsing, coordinate conversion, error-message mapping,
and orchestration are all unit-tested with mocked AI output — none of it
needs a network call or an API key to run. The one thing that genuinely
can't be unit-tested is real handwriting-recognition quality; that's been
verified manually (see `context.md`'s Milestone 5–7 entries) with a real
Gemini key against synthetic fixtures, not part of the automated suite.

## Deployment

Works as a standard Next.js app on Vercel (or any Node.js host):

1. Push to GitHub, import the repo in Vercel.
2. Set `GEMINI_API_KEY` (required) in the project's environment variables.
   `GEMINI_MODEL`/`MAX_FILE_SIZE_MB` are optional — see `.env.example`.
3. Deploy. No database, no other infrastructure to provision.

Two things specific to this app worth knowing before deploying:

- `/api/process` and `/api/evaluate` both declare `export const runtime = "nodejs"`
  (they use `Buffer`/`pdfjs-dist`, not Edge-compatible) and a `maxDuration`
  — 60s and 30s respectively. Vercel's Hobby tier caps function duration
  lower than that; raise the tier or lower `maxDuration` to match your plan
  if a large document times out.
- `lib/extraction/pdf-text.ts` resolves its pdfjs worker/font-data paths
  with `path.join(process.cwd(), ...)` rather than a static import, which
  a serverless bundler's file tracer can miss. `next.config.ts` explicitly
  force-includes those files via `outputFileTracingIncludes` for exactly
  this reason — if pdfjs ever throws a "worker not found"-style error only
  in production, that's the first thing to check.

## Limitations

- **Handwriting quality depends on Gemini's OCR**, same as any AI-based
  approach — very messy handwriting will transcribe imperfectly. The
  system surfaces uncertainty (confidence, "Needs review", "Unmatched")
  rather than hiding it, but it can't fix a genuinely illegible scan.
- **A hard refresh on the results page loses the answer-sheet preview.**
  The `AssessmentResult` itself survives (mirrored to `sessionStorage`),
  but the uploaded file's blob URL doesn't — there's no server-side file
  storage by design (no database, per the spec), so the viewer asks for a
  re-upload rather than silently showing nothing.
- **No persistence across sessions or devices.** Everything lives in the
  browser tab for the current session; closing the tab loses the result
  entirely. This is a deliberate tradeoff for a no-database, no-auth
  assignment scope, not an oversight.
- **Positional-fallback mapping** (unlabeled answers matched to remaining
  questions by order) only fires when the unlabeled-answer count exactly
  matches the remaining-question count — by design, not a bug: see
  `lib/mapping/positional-fallback.ts` for why a looser heuristic would
  risk silently mismatching answers around a genuinely unanswered question.

## Future Improvements

- Persist results server-side (still without a full database — e.g. a
  short-lived signed URL or object storage) so a results link can be
  reopened later or shared, instead of living only in the browser tab.
- Let the teacher nudge a low-confidence or unmatched mapping by hand
  (drag an answer onto the right question) rather than only reviewing it.
- Batch-process multiple students' answer sheets against the same question
  paper in one session.
