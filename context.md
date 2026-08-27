# Context Log

Running log of what's been done, why, and what's next. Updated after every
milestone; each update is committed and pushed.

## Conventions

- Every production source file targets the spec's size bands (components
  ~40–80 lines, utilities ~20–60, hard cap 150 unless justified in a header
  comment).
- After every milestone: `npm run typecheck && npm run lint && npm run test`
  must be clean before it's marked done.
- AI (Gemini) is used only where deterministic code genuinely can't do the
  job: handwriting transcription/region detection, and resolving answers
  that remain ambiguous after deterministic mapping. Everything else
  (parsing, normalization, ordering, coordinates, validation, UI state) is
  deterministic.

## Milestone 1 — Foundation (done)

- Scaffolded with `create-next-app` (Next 16.3.3, React 19.2.8, TypeScript,
  Tailwind v4, ESLint, App Router, no `src/` dir). Had to scaffold into a
  temp `vedaai-app/` subfolder because `create-next-app` rejects the repo's
  capitalized folder name as an npm package name, then moved everything up
  to root and fixed `package.json`'s `name`.
- Removed default boilerplate we don't want: `CLAUDE.md`/`AGENTS.md` (auto
  -generated, not relevant here), placeholder SVGs in `public/`.
- Installed runtime deps: `@google/generative-ai`, `pdfjs-dist`,
  `react-pdf`, `zod`, `lucide-react`. Installed `vitest` +
  `@vitejs/plugin-react` as dev deps, added `typecheck`/`test` npm scripts
  and a `vitest.config.ts`.
- `pdfjs-dist@^6` had a high-severity advisory (arbitrary JS execution on a
  malicious PDF) and also requires Node ≥22.13, newer than the dev machine's
  Node 20.20. Pinned to `pdfjs-dist@5.4.624` instead — below the vulnerable
  range (`>=5.6.83 <6.2.108`) and declares `node >=20.16.0`, so it's both
  patched and compatible with the current toolchain. `npm audit` is clean.
- Added `types/assessment.ts` with the full domain model from the spec
  (`Question`, `AnswerRegion`, `Answer`, `AnswerMapping`, `Evaluation`,
  `AssessmentResult`), plus a `MappingMethod` union (adds `"positional"` to
  the spec's method list, since the plan's mapping pipeline has a
  deterministic positional-fallback stage between normalized-label and
  semantic matching — kept as its own method value so the UI can
  distinguish it from a bare "explicit-label" match).
- Wrote `.env.example` (`GEMINI_API_KEY`, `GEMINI_MODEL`, `MAX_FILE_SIZE_MB`).
- Wrote the initial `README.md` (Overview/Features/Architecture/Pipeline/AI
  strategy/mapping strategy/coordinates/edge cases/perf/tech stack/local
  setup/env vars/testing sections); Deployment/Limitations/Future
  Improvements are placeholders filled in during hardening (Milestone 8).
- Did **not** pre-create empty `lib/`/`components/` subfolders with
  placeholder files — folders are created organically as each milestone
  adds real files into them, so there's no throwaway/dead code sitting in
  the repo.
- `git init`, committed, remote set to
  `https://github.com/Aamir0718/VedaAI-Assessment-Extraction-Answer-Mapping.git`,
  pushed to `main`.

**Verification:** `npm run typecheck`, `npm run lint`, `npm run build` all
clean. No tests yet (nothing to unit-test until Milestone 2).

**Next:** Milestone 2 — question parser (deterministic + AI fallback) and
answer extraction (`lib/ai/`, `lib/extraction/`).

## Milestone 2 — Extraction (done)

- `lib/validation/file-validation.ts`: deterministic `validateFile()` (mime
  type allowlist + size limit from `MAX_FILE_SIZE_MB`, default 20MB) and the
  shared `FileInput` type (`buffer`/`mimeType`/`name`) used everywhere a raw
  uploaded document is passed around.
- `lib/extraction/question-patterns.ts` + `question-parser.ts`: regex-driven
  deterministic parser. Recognizes `1.`/`2)`, sub-parts `11(a)`/`11 (a)`/
  `11.a`, roman-numeral sub-parts `12(i)`/`12(ii)`, and an optional leading
  `Q`/`Question` prefix. Sub-parts become independent `Question` entries
  (never merged into their parent number), original printed order is
  preserved verbatim (the parser never sorts), and continuation lines are
  appended to whichever question is currently open. 7 unit tests, no I/O.
- `lib/extraction/pdf-text.ts`: per-page text extraction via
  `pdfjs-dist/legacy/build/pdf.mjs` (the Node-safe legacy build — no canvas
  needed for text-only extraction, confirming the plan's "no rasterization"
  decision). Had to explicitly wire `GlobalWorkerOptions.workerSrc` and
  `standardFontDataUrl` to `file://` URLs resolved from `node_modules` —
  pdfjs-dist doesn't locate these automatically outside a bundler, and on
  Windows the path must be a proper `file://` URL (a raw `C:\...` path
  throws "Only URLs with a scheme in: file, data, and node are supported").
  Verified against a real PDF generated with `pdf-lib` (added as a dev
  dependency purely to generate synthetic PDF fixtures at test time — no
  binary fixtures committed).
- `lib/extraction/extract-questions.ts`: orchestrator — tries the
  deterministic parser first and trusts it whenever it finds ≥1 question;
  falls back to one AI call only when the PDF has no embedded text (image-
  based) or the parser recognized zero labels (complex/unusual layout).
  Tests mock `geminiAnalyzer` to assert the AI path is *not* called on the
  happy path, and *is* called on both fallback triggers.
- `lib/extraction/extract-answers.ts`: thin wrapper assigning stable
  `a-{n}` ids to whatever Gemini returns, in its returned order (order here
  isn't semantically meaningful the way question order is — the UI keys off
  question order, not answer order).
- `lib/ai/types.ts`: the `DocumentAnalyzer` interface (per the plan's AI
  boundary — `extractQuestionsFromDocument`, `extractAnswers`,
  `resolveAmbiguousMappings`, `evaluate`, the latter two batched over
  arrays, not per-item), `AiOutputError`, and `Extracted*`/`ResolvedMapping`
  types (the AI-provided subset of each domain type — ids are always
  assigned by our code, never trusted from the model).
- `lib/ai/schemas.ts`: Zod schemas mirroring exactly what each prompt asks
  for — nothing more. `resolvedMappingSchema`'s `method` is constrained to
  `"semantic" | "unmapped"` only, since explicit/normalized/positional
  methods are decided deterministically in Milestone 3 and never come from
  the model.
- `lib/ai/prompts.ts`: one short prompt per `DocumentAnalyzer` method.
  Mapping/evaluation prompts embed only the minimal JSON (ids, text,
  candidate list) the model needs — never the raw document bytes again.
  The mapping prompt explicitly tells the model to return `"unmapped"`
  rather than guess, matching the "never hallucinate a mapping" requirement.
- `lib/ai/client.ts`: single call site (`generateJson`) used by every
  `DocumentAnalyzer` method — builds the Gemini `Part[]` (prompt text +
  inline-base64 files), requests JSON mode, strips an accidental markdown
  fence, `JSON.parse`s, and Zod-validates before returning. Any failure
  (missing API key, network error, non-JSON output, schema mismatch) throws
  `AiOutputError` — nothing unvalidated ever leaves this module.
- `lib/ai/gemini-analyzer.ts`: implements `DocumentAnalyzer` using the above
  — each method is a single `generateJson` call. `resolveAmbiguousMappings`
  and `evaluate` short-circuit to `[]` without a network call when given an
  empty input array (there's nothing to batch).
- Dependency note: `zod@4` — used the same object/array/enum API as v3, no
  compatibility issues encountered.
- No live Gemini calls in the test suite (per the plan) — `gemini-analyzer`
  is mocked in extraction tests; the AI call path itself will get a manual
  smoke test once `GEMINI_API_KEY` is available.

**Verification:** `npm run typecheck && npm run lint && npm run test && npm run build`
all clean. 19 tests passing across 5 files. Largest new file is 66 lines
(`question-parser.ts`) — well under the 150-line cap.

**Next:** Milestone 3 — deterministic answer mapping (`lib/mapping/`):
label normalization, explicit/normalized matching, positional fallback,
batched AI semantic fallback, confidence model, full edge-case test corpus.

## Milestone 3 — Mapping (done)

- `lib/mapping/normalize-label.ts`: canonicalizes a label to a comparable
  key — `"11(a)"`, `"11 (a)"`, `"Q11(a)"`, `"Q11 (a)"`, `"11.a"` all reduce
  to `"11a"`; roman-numeral sub-parts (`"12(i)"` vs `"12(ii)"`) stay
  distinct. Pure regex, no AI.
- `lib/mapping/explicit-match.ts`: tries an exact string match against
  `Question.number` first (method `"explicit-label"`, confidence 0.98),
  then normalized-label equivalence (method `"normalized-label"`,
  confidence 0.9). Returns `null` — never a guess — when nothing matches.
- `lib/mapping/positional-fallback.ts`: a deliberately narrow deterministic
  heuristic for "wrote every answer in order, never labelled any of them."
  It only pairs unlabeled answers with remaining unmapped questions
  (printed order) when the two counts match *exactly* — if they don't,
  positional order alone isn't trustworthy (e.g. a genuinely unanswered
  question sitting among unlabeled answers would silently shift everything
  after it), so those answers are deliberately left for the AI semantic
  step instead of guessing. This was the one real design call in this
  milestone: a naive index-based positional matcher would have been wrong
  exactly in the cases the spec calls out as required (unanswered
  questions, out-of-order/unmatched answers), so it's scoped to the case
  it can actually get right for free.
- `lib/mapping/map-answers.ts`: the pure orchestrator. Priority order per
  answer: explicit → normalized → positional (count-matched) → batched AI
  semantic call for whatever's left. Two reliability details worth noting:
  (1) every answer gets exactly one `AnswerMapping` — the AI-fallback loop
  always emits a mapping (`"unmapped"` if the model didn't resolve it),
  matching "never silently discard an unmatched answer"; (2) an AI-returned
  `questionId` is validated against the actual remaining candidate set
  before being trusted — a hallucinated id that doesn't exist becomes
  `"unmapped"` rather than corrupting a mapping. Schema validation upstream
  only checks *shape*; this checks *correctness*.
- `lib/mapping/mapping-status.ts`: two tiny derived-state helpers,
  `getUnansweredQuestions` (questions with no mapped answer) and
  `getUnmappedAnswers` (answers whose mapping method is `"unmapped"`) —
  these back the "Identify Unanswered / Unmapped" pipeline stage and the
  results UI's ○/⚠/✕ status icons.
- Full edge-case test corpus per the spec's exact `tests/` layout —
  `basic/`, `out-of-order/`, `subquestions/`, `unanswered/`, `unmatched/`,
  `multi-page/`, `ambiguous/` — each exercising `mapAnswers` end to end
  with mocked `Question[]`/`Answer[]` fixtures (`tests/fixtures/mapping-
  fixtures.ts`) and a mocked `resolveAmbiguousMappings`, zero network
  calls. Plus direct unit tests for `normalizeLabel`, `explicitMatch`, and
  `positionalFallback` in `tests/mapping/`. 41 tests total across the repo.
- One test-writing gotcha: Vitest's `toMatchObject({ questionId: undefined })`
  does not match an object where the key is simply absent — had to assert
  `.questionId` is `undefined` via direct property access instead.

**Verification:** `npm run typecheck && npm run lint && npm run test && npm run build`
all clean. Largest file in the mapping module is 68 lines (`map-answers.ts`).

**Next:** Milestone 4 — Viewer: `lib/pdf/coordinates.ts` (+tests), PDF
rendering with `react-pdf`, highlight overlay, multi-region navigation.

## Milestone 4 — Viewer (done)

- `lib/pdf/coordinates.ts`: the only place normalized-region → pixel math
  happens (`regionToPixels`), plus two small grouping helpers
  (`regionsByPage`, `pagesForRegions`) used for multi-page navigation. Pure
  functions, no React/PDF.js types. 5 unit tests, including one confirming
  the conversion is resolution-independent (doubling page size exactly
  doubles the output rect) — the actual point of normalized coordinates.
- Version-aligned `pdfjs-dist`: `react-pdf@10` bundles its own internal
  `pdfjs-dist@5.4.296`. Our own server-side extraction code (Milestone 2)
  had a separately pinned `5.4.624`. Re-pinned the root dependency to the
  exact `5.4.296` react-pdf uses so npm dedupes to a single copy —
  eliminates any risk of the browser bundle and its worker script silently
  drifting to different pdfjs API versions (pdfjs hard-fails if they ever
  don't match).
- `components/viewer/pdf-worker-setup.ts`: wires react-pdf's Web Worker via
  `new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url)` — this
  resolves through actual module resolution, not a hardcoded/CDN string, so
  it can never point at a different pdfjs version than the one just
  deduped above. Also polyfills `URL.parse` (a static method pdfjs-dist's
  browser build calls, only standardized in browsers around mid-2024) so
  rendering doesn't silently break on an older browser — found this by
  actually smoke-testing in a slightly older cached headless Chromium and
  hitting exactly that crash.
- `components/viewer/HighlightOverlay.tsx` / `PageCanvas.tsx` /
  `PdfViewer.tsx`: `PdfViewer` owns `<Document>`, tracks which of the
  answer's regions is currently shown, and renders Previous/Next-region
  controls only when an answer actually spans more than one page.
  `PageCanvas` renders one `<Page>` (text/annotation layers disabled —
  a scanned handwritten sheet has no useful embedded text layer, and
  skipping it avoids needing react-pdf's layer CSS) and measures its
  rendered size via `onRenderSuccess`. `HighlightOverlay` is purely
  presentational, driven entirely by `lib/pdf/coordinates.ts`.
- `components/viewer/ImageViewer.tsx` + `AnswerSheetViewer.tsx`: the
  mandatory "PDF or images" upload requirement is scoped as *one uploaded
  file*, either a multi-page PDF or a single image (one page) — not a
  multi-image multi-page sheet in one upload. `AnswerSheetViewer` picks
  the right renderer by mime type; both share `HighlightOverlay`.
- **Verification methodology worth recording**: rather than trusting the
  code compiled, actually launched the dev server and screenshotted a
  temporary route rendering a real `pdf-lib`-generated PDF with a known
  highlight region, using a Playwright-driven headless Chromium (no
  `chromium-cli` available on this Windows box, so drove `playwright-core`
  directly). This caught two real bugs neither typecheck nor lint could:
  (1) a Next.js private-route pitfall — a folder/file prefixed with `_`
  under `app/` is silently excluded from routing, so an initial
  `app/api/_dev-test-pdf/route.ts` 404'd; renamed without the prefix.
  (2) pdfjs-dist's browser build crashing the page during SSR because its
  module-scope code isn't meant to run in Node at all — fixed by loading
  `PdfViewer` via `next/dynamic(..., { ssr: false })`, which is also just
  the architecturally correct choice (canvas rendering is browser-only).
  The resulting screenshot showed the highlight rectangle exactly framing
  the target text, confirming `regionToPixels` end to end, not just in
  isolation. All temporary verification scaffolding (the test route, test
  page, screenshot script, a `--no-save` Playwright install) was removed
  afterward — only the four production viewer files and `coordinates.ts`
  remain.
- Recovered `AGENTS.md`/`CLAUDE.md` at the repo root: these are
  auto-(re)generated by `next dev` itself (Next 16 writes version-specific
  agent guidance pointing at `node_modules/next/dist/docs/`) and explicitly
  ask to be committed so they don't show as a perpetual untracked diff.
  Milestone 1 deleted them as assumed boilerplate — that was a mistake,
  corrected here.

**Verification:** `npm run typecheck && npm run lint && npm run test && npm run build`
all clean (46 tests). Manual visual verification via headless-Chromium
screenshot, described above. Largest new file: 62 lines (`PdfViewer.tsx`).

**Next:** Milestone 5 — Complete pipeline: streaming
`process-assessment.ts` orchestrator, `POST /api/process`, wiring
upload → processing → results end to end with client-side result state.

## Milestone 5 — Complete pipeline (done)

- `lib/processing/stages.ts`: the fixed six-stage sequence from the spec's
  own example (`files-uploaded` → `reading-question-paper` →
  `questions-extracted` → `reading-answer-sheet` → `mapping-answers` →
  `preparing-results`), plus default labels so a not-yet-reached stage
  still renders sensible text instead of nothing.
- `lib/processing/process-assessment.ts`: the single `processAssessment()`
  async generator — the one application-layer workflow the spec asks for.
  Wraps the whole body in one try/catch so any failure becomes a
  teacher-facing `{ type: "error" }` event (via `to-friendly-message.ts`)
  instead of throwing past the boundary or leaking a raw stack/provider
  error into the UI.
- `app/api/process/route.ts`: the one processing endpoint. Reads
  `multipart/form-data`, validates both files with the existing
  `validateFile` (Milestone 2) *before* entering the pipeline, then pipes
  `processAssessment()` into a `ReadableStream` of NDJSON lines
  (`runtime = "nodejs"` — needs Buffer/pdfjs; `maxDuration = 60` for the
  single request that covers the whole analysis pass).
- `lib/processing/read-ndjson-stream.ts`: pure client-side async generator
  parsing a streamed NDJSON response, chunk-boundary-safe (a JSON object
  split across two network chunks is buffered until it parses). 4 unit
  tests against a fabricated `ReadableStream`, no real server needed.
- `lib/processing/use-process-assessment.ts`: the client hook driving
  submit → stream → navigate, keeping `app/page.tsx` a thin view.
- `lib/state/assessment-store.tsx`: a React Context holding the current
  `AssessmentResult` (mirrored into `sessionStorage`, JSON-serializable
  parts only — a blob URL can't survive a reload anyway) rather than
  relying on server memory, which a stateless serverless deploy can't
  guarantee stays around between the POST and a later page load.
- `app/page.tsx`: upload form ⇄ processing view as two states of one page
  (per the repo structure's single `app/page.tsx` — Upload and Processing
  are the same route, Results is the separate `/assessment` route).
  `components/upload/` (FileDropzone, FilePreviewCard) and
  `components/processing/` (StageList, StageItem) stay functional-not-
  final here; Milestone 6 does the Figma pass on top of this same wiring.
- `app/assessment/page.tsx` + `components/assessment/` (QuestionList,
  QuestionDetail, UnmatchedAnswers): a working 3-pane results view.
  Selection is either a question or, deliberately, an *unmatched answer*
  — the mandatory "never silently discard an unmatched answer" requirement
  needs the unmapped ones to be visible and clickable too, not just
  questions, so this shipped now rather than deferred to the polish pass.
- `components/viewer/AnswerSheetViewer.tsx` now itself wraps `PdfViewer` in
  `next/dynamic(..., { ssr: false })` (moved from the Milestone 4 scratch
  page into the real component) so every consumer gets the SSR-safety for
  free instead of having to remember it.
- **Bug found by actually running the pipeline, not just reviewing it**:
  built two synthetic PDF fixtures (a real multi-line question paper, a
  blank answer sheet) and drove the full upload → stream → error flow
  through a headless-Chromium Playwright script against the real dev
  server and a real `/api/process` call. First run: the question parser
  only found **1 of 4** questions. Root cause —
  `lib/extraction/pdf-text.ts` joined every text item on a page with a
  single space and no line breaks at all, so a multi-line PDF page
  collapsed into one giant line before it ever reached the regex parser,
  which is line-based. This is exactly the kind of bug unit tests with
  single-line fixtures (Milestone 2's original tests) can't catch — every
  existing test happened to use one line per page. Fixed by extracting a
  `joinTextItems()` helper that inserts a newline whenever a text item's
  baseline (`transform[5]`) jumps from the previous item's, which is how
  pdfjs itself signals a new visual line; added both a direct unit test
  for `joinTextItems` and a page-level regression test with two lines on
  one page. Re-ran the same Playwright flow afterward: all 4 questions
  extracted correctly, pipeline proceeded through every stage in order,
  and — with no `GEMINI_API_KEY` configured yet — failed exactly where
  expected (the always-AI answer-extraction step) with the friendly
  message, never a stack trace. Screenshots matched the spec's own
  progress-UI example (✓/✓/✓/●/○/○) almost verbatim. All temporary
  fixtures/scripts/`--no-save` Playwright install removed afterward.

**Verification:** `npm run typecheck && npm run lint && npm run test && npm run build`
all clean (57 tests). Full manual end-to-end run via headless Chromium,
described above — this is the milestone where "it typechecks" and "it
actually works" were meaningfully different things, and only the second
was accepted. Largest file: 75 lines (`app/assessment/page.tsx`).

**Next:** Milestone 6 — UI: Figma-fidelity pass. Note: the Figma file
requires interactive/authenticated access this environment doesn't have
(fetching the URL doesn't expose the actual design specifics) — will
build a clean, professional UI from the spec's textual layout description
instead of pixel-matching, and say so plainly rather than claim fidelity
that wasn't achievable.

## Milestone 6 — UI (done)

The user supplied real Figma screenshots (desktop + mobile, upload/
processing/results) directly, with explicit instructions: use them as
design *direction*, not a literal spec — "make it even better... crazy and
very user friendly." Also supplied what was labeled an "api key" alongside
the screenshots.

**Credential handling.** The pasted string (`AQ.Ab8...`) didn't match
Gemini's usual `AIzaSy...` key format, so before touching any file: tried
it against the Figma REST API first (`X-Figma-Token` header) since it
arrived with the design screenshots — got `403 Invalid token`, ruling that
out. Tried it against Gemini's `v1beta/models` list endpoint instead — `200
OK`. Wrote it to `.env.local` only (already gitignored, verified via `git
status` before proceeding) — never into any file that gets committed, never
echoed in full in any tool output. It turned out to be a genuinely valid
Gemini key; see the debugging trail below for how long it took to actually
prove that.

**Design decisions, and why they deliberately diverge from the screenshots:**
- Skipped the screenshots' full app-shell sidebar (Home / My Classroom /
  Assignments / Exams / My Library nav, school/user profile card). The
  spec's own §25 explicitly forbids building classrooms, teacher/student
  profiles, multi-tenant chrome — replicating that sidebar would imply
  features this app deliberately doesn't have. Kept only a minimal brand
  header (`components/layout/AppHeader.tsx`) across all three screens.
- The screenshots' processing screen shows a generic "Extracting... This
  may take a while" card with no visible stages — which is exactly what
  spec §3 calls a *mandatory* violation ("avoid a generic infinite loading
  spinner... show which stage is running"). Kept the real per-stage
  `StageList` from Milestone 5 and restyled it to match the screenshots'
  visual language (rounded card, orange accent, sparkle icon) instead of
  discarding the stage list — functional requirement wins per the user's
  own stated priority order.
- The screenshots' results screen uses a two-pane layout (accordion
  question list with inline expand-to-see-feedback, no separate
  question/answer detail column) rather than three separate panes.
  Adopted this — it's genuinely a better use of space — via
  `QuestionAccordion`/`QuestionCard` replacing the old separate
  `QuestionList`/`QuestionDetail` pair. Score badges ("2/2", "0/2") in the
  screenshots are grading (Milestone 7, not built yet); `StatusPill`
  conditionally shows a mark badge when an `Evaluation` exists and falls
  back to a mapping-confidence badge (Mapped/Needs review/Unanswered/
  Unmatched) otherwise — designed so Milestone 7 lights it up for free by
  just passing real `evaluations` through.
- Added real drag-and-drop to `FileDropzone` and a client-side PDF page
  count in the file preview (`lib/pdf/count-pdf-pages.ts`, reusing the same
  pdfjs worker setup as the viewer) — small "very user friendly" additions
  matching the screenshots' "2MB • 2 Pages" detail line, using the actual
  configured size limit rather than hardcoding the screenshots' placeholder
  "10MB".
- Added zoom controls + a shared `ViewerToolbar` to both `PdfViewer` and
  `ImageViewer` (the screenshots show "− 100% +"). `ImageViewer`'s zoom
  needed care: `<img onLoad>` only fires once, so re-measuring
  `clientWidth` after a zoom change would go stale — instead capture the
  image's natural aspect ratio once and derive `{width, height}` from the
  current zoom level on every render.
- Pinned the app to light mode explicitly in `globals.css` (removed the
  default Next.js `prefers-color-scheme: dark` block) — every utility class
  added this milestone is light-only; leaving the dark-mode CSS variables
  in place would have produced a broken half-themed page for any teacher
  on a dark-mode OS.

**The debugging trail — three real, unrelated bugs found only by actually
running the app with a real key, not by reading the code:**

1. *pdfjs pulled into the SSR bundle.* `next build` printed "Please use the
   `legacy` build in Node.js environments" — `FileDropzone` statically
   imported `count-pdf-pages.ts`, which imports `react-pdf`'s `pdfjs` at
   module scope, and Next.js evaluates client-component modules once during
   static-generation's server pass even though the function is only ever
   *called* from a browser event handler. Fixed with a dynamic
   `import("@/lib/pdf/count-pdf-pages")` inside the handler instead of a
   static top-level import — defers the pdfjs load to when a file is
   actually chosen, and the warning disappeared entirely.
2. *A genuinely stale dev server.* Kept getting "API key not valid" even
   after fixes that should have worked. Cause: an old `next dev` process
   from Milestone 4's debugging (PID from hours earlier) was still bound to
   port 3000 the whole time — `lsof -ti:3000 | xargs kill` (the pattern used
   throughout this session) silently doesn't map to the right PID in this
   Windows/Git-Bash environment. Found and killed it with
   `netstat -ano | grep LISTENING` + `taskkill //F //PID`, which is what
   actually works here going forward.
3. *Two independent, unrelated causes behind the same symptom* — both had
   to be found before the pipeline actually worked:
   - The hardcoded default model `gemini-2.5-flash` (accurate as of this
     assistant's training) turned out to be retired — Google's own 404
     response named the replacement (`gemini-3.6-flash`). Confirmed via
     direct `curl` against `generateContent` (bypassing the SDK entirely)
     before touching any code, updated `DEFAULT_MODEL` in `lib/ai/client.ts`
     and `.env.example`.
   - Even after that fix, the *server* still failed while raw `curl` with
     the identical key/model/headers kept succeeding. Root cause: this
     Windows machine has a **pre-existing user-level environment variable
     `GEMINI_API_KEY=your_api_key_here`** (an unrelated leftover from some
     other project's setup) — Next.js's env loading never overrides a
     variable that already exists in `process.env`, so `.env.local` was
     being silently ignored the entire time. Confirmed with a one-line
     temporary debug log of the key's length/prefix (never the full key),
     found it via `printenv` and `[System.Environment]::GetEnvironmentVariable`.
     This is the user's own system state, not something to silently patch
     around in code — documented in the README's Environment Variables
     section as a real gotcha, since it will bite anyone running this
     project on this machine, not just this session.
   - Also added `console.error` (server-side only) in `processAssessment`'s
     catch block — the teacher-facing message was already appropriately
     generic, but there was previously no way to diagnose a real failure
     from server logs at all, which is how the first two layers of this
     bug stayed hidden as long as they did.

**Verification.** Full real run via a headless-Chromium Playwright script
(same approach as Milestones 4–5) against synthetic-but-realistic fixtures
(a 4-question paper including a `3(a)`/`3(b)` pair, and a typed "answer
sheet" with three answers and one deliberately left blank) — this time with
the actual Gemini key, all the way through: 4 questions extracted, 3
answers extracted with real bounding boxes, all 3 mapped via explicit-label
correctly, `3(b)` correctly shown as **Unanswered**. Directly inspected the
DOM to confirm the highlight overlay's computed rect and color, then a
cropped screenshot showed the orange highlight box exactly framing "Q1.
Paris is the capital of France." — and clicking Question 2 moved it to
frame the correct second answer. This is the first milestone verified
against real, non-mocked AI output end to end. All temporary fixtures/
scripts and the `--no-save` Playwright install were removed afterward;
`.env.local` (with the real key) stays local-only, never committed.

**Verification (automated):** `npm run typecheck && npm run lint && npm run test && npm run build`
all clean (57 tests — no change in count this milestone, UI-only). Largest
file: 92 lines (`app/assessment/page.tsx`).

**Next:** Milestone 7 — Optional evaluation: `/api/evaluate`, wiring real
`Evaluation[]` through to the `StatusPill`/`QuestionCard` slots already
built for it this milestone.

## Milestone 7 — Optional evaluation (done)

- `lib/evaluation/evaluate.ts`: `evaluateAssessment()` builds the list of
  gradable `{question, answer}` pairs — only questions with a confidently
  *mapped* answer (`method !== "unmapped"`, both records actually exist) —
  and makes exactly one batched `analyzer.evaluate()` call, same "never
  per-item" discipline as the mapping fallback. Same defensive pattern as
  `map-answers.ts` too: an AI-returned `questionId` that doesn't match one
  of the pairs actually sent is dropped rather than trusted. 3 unit tests
  with a mocked analyzer.
- `app/api/evaluate/route.ts`: a genuinely separate endpoint from
  `/api/process` — this is the one place the plan's "single endpoint"
  guidance is deliberately not followed, because the spec requires grading
  to be triggerable independently so it can never delay mapping/
  highlighting. Validates its request body with a small Zod schema (real
  external input this time, unlike the same-app-echoing-its-own-data
  argument that applied loosely elsewhere) before calling
  `evaluateAssessment`; logs the real error server-side, returns a generic
  502 message to the client.
- **On-demand, not automatic.** Considered auto-triggering grading the
  moment results render (also satisfies "doesn't block mapping"), but
  chose an explicit "Grade with AI" button instead
  (`components/assessment/GradeButton.tsx` +
  `lib/evaluation/use-evaluate-assessment.ts`) — grading is explicitly
  optional per the spec, and an automatic AI call a teacher didn't ask for
  is exactly the kind of unnecessary AI usage §6/§17 warn against. The
  button becomes "✓ Graded with AI" once done; a failure shows inline
  without touching the mapping/highlighting the teacher already has.
- `lib/state/assessment-store.tsx`: added `setEvaluations()`, merging into
  the existing result (and re-persisting to `sessionStorage`) rather than
  a separate piece of state — keeps `AssessmentResult` as the one shape
  the UI reads from, per the spec's own domain model.
- `StatusPill`/`QuestionCard` needed no changes at all — Milestone 6 built
  them to prefer `evaluation` (mark badge) over `mapping` (confidence
  badge) whenever one exists; passing real evaluations through was enough
  to light them up.

**Verification.** Real end-to-end run again (not mocked): called
`/api/process` then fed its actual output straight into `/api/evaluate` —
got back real marks and feedback, including the AI correctly deducting
marks on the incomplete Newton's-first-law answer with specific, accurate
feedback about what was missing. Then drove the full browser flow through
Playwright: uploaded → processed → clicked "Grade with AI" → confirmed the
button flipped to "✓ Graded with AI", every mapped question's badge
switched from a confidence pill to a real "`n`/10" mark, the unanswered
question stayed correctly excluded, and the expanded card's "AI Feedback"
section rendered the real text. Screenshotted for a final visual check.
All temporary scripts and the `--no-save` Playwright install removed
afterward.

**Verification (automated):** `npm run typecheck && npm run lint && npm run test && npm run build`
all clean (60 tests). Largest file: 96 lines (`app/assessment/page.tsx`).

**Next:** Milestone 8 — Hardening: remaining edge cases, error-path tests,
file-size audit, full README completion (Deployment/Limitations/Future
Improvements sections), deployment readiness check, final push.

## Milestone 8 — Hardening (done)

- **Empty states, not silent gaps.** `questions.length === 0` (question
  paper genuinely yielded nothing, even after the AI fallback) now shows a
  real `EmptyResultsState` instead of an empty accordion; `answers.length
  === 0` shows an inline banner above the question list rather than
  leaving the teacher to notice every question says "Unanswered" and
  wonder why. Neither is an error — both are legitimate outcomes the spec
  explicitly asks to handle gracefully.
- **Instant client-side file validation.** Previously type/size checks
  only ran server-side in `/api/process`, so a rejected file only showed
  an error after a round-trip. Refactored `file-validation.ts` to share
  its rule logic between the existing byte-accurate `validateFile`
  (server) and a new metadata-only `validateFileMeta` (client — `File.size`/
  `File.type` are available synchronously, no bytes read) so `FileDropzone`
  can reject immediately on selection. The server check stays authoritative;
  this only makes the common case feel instant. Verified in-browser that a
  disallowed file type is rejected with no console error (had a specific
  concern here: does referencing `process.env.MAX_FILE_SIZE_MB` from
  client-shared code crash in the browser? No — Next.js's client bundle
  quietly resolves any non-`NEXT_PUBLIC_` env read to `undefined` rather
  than throwing, so the shared `maxFileSizeBytes()` helper safely falls
  back to the default on the client. Confirmed empirically, not just
  assumed.)
- **Deployment-readiness fix, found by reasoning about the deploy target,
  not by deploying.** `lib/extraction/pdf-text.ts` resolves its pdfjs
  worker/standard-fonts paths via `path.join(process.cwd(), ...)` — a
  dynamic string, not a static `import`/`require` a serverless bundler's
  file tracer can follow. On Vercel this could silently ship a function
  missing those files even though it builds and runs fine locally (full
  `node_modules` on disk). Added explicit `outputFileTracingIncludes` for
  `/api/process` in `next.config.ts` naming both paths — a standard,
  low-risk safeguard for exactly this "dynamically-required file" gap.
  Couldn't fully verify Vercel's own tracer behavior without an actual
  deploy, so documented the reasoning and the fix in the README rather
  than silently trusting it.
- **More edge-case tests**, each targeting a real corner rather than
  padding the count: a corrupt/non-PDF buffer through
  `extractPdfPageText` (confirmed pdfjs's real thrown message —
  `InvalidPDFException: "Invalid PDF structure."` — actually matches
  `toFriendlyMessage`'s regex, not just assumed it would); direct tests
  for `toFriendlyMessage` covering the AI-error path, the corrupt/
  password-protected-PDF path, the generic fallback (asserting the raw
  error text like a stack trace or connection detail never leaks through),
  and a non-`Error` thrown value; `validateFileMeta` parity tests.
- **Small refactor for clarity, not just to hit a line count**:
  `app/assessment/page.tsx` had grown to 111 lines after the empty-state
  additions. Pulled out `resolveSelection()` (the mapping/answer
  derivation logic) into `lib/assessment/resolve-selection.ts` — now
  independently unit-tested (4 tests) without needing React at all — and
  extracted `NoResultsState`/`ViewerEmptyState` as small reusable
  components. Back down to 93 lines.
- Added `.gitattributes` (`* text=auto eol=lf`) — the repo had been
  accumulating "LF will be replaced by CRLF" warnings on every `git add`
  all session; confirmed via `git add --renormalize .` that every already-
  committed file was already LF-normalized (the warnings were purely a
  Windows checkout artifact), so this was a safe, no-diff addition.
- README: completed Deployment (concrete Vercel steps, the two deploy-
  specific gotchas above), Limitations (handwriting-quality dependency,
  single-file-per-document scope, no cross-session persistence, the
  positional-fallback count-match design choice), and Future Improvements
  sections. Updated Edge Cases/Performance Decisions to describe what's
  actually built rather than pointing at an external plan file.

**Verification.** Full real run one more time after all of the above —
same headless-Chromium flow as every prior milestone, this time confirming
the page-2 refactor (extracted `resolveSelection`) didn't change any
observable behavior: question switching, highlight movement, and grading
all still worked identically, zero console errors. `npm run typecheck &&
npm run lint && npm run test && npm run build` all clean — **71 tests**,
21 test files. Full-repo file-size sweep: largest source file is 93 lines
(`app/assessment/page.tsx`); total source is ~2,160 lines across the whole
app. All temporary verification scripts and the repeated `--no-save`
Playwright installs removed; `package.json`/`package-lock.json` confirmed
untouched by them (`git diff --stat` empty).

**Status: all 8 milestones complete.** The application satisfies the
spec's full Definition of Done (§29) — question/answer extraction,
deterministic-first mapping with confidence, click-to-highlight across
multi-page answers, unanswered/unmatched states surfaced (never hidden),
optional AI grading, real stage-by-stage progress, and graceful error
handling throughout — verified with real Gemini calls, not just mocks.

## Post-milestone design pass — de-branding + visual polish

After running the finished app, the user gave direct feedback: don't
mention "VedaAI" anywhere in the UI, and the design read as generic —
wanted better typography and more interactivity.

- **Removed all "VedaAI" text from the UI.** `AppHeader` now shows an
  icon-only mark (gradient rounded square, sparkle icon) with no product
  name — didn't invent a replacement brand name unasked, since the request
  was to drop the mention, not rename it to something else. Also updated
  the browser-tab title (`app/layout.tsx` metadata) to a plain functional
  description. Grepped the whole `.ts`/`.tsx` tree afterward to confirm
  zero remaining matches. Left the README's title and repo/package name
  untouched — those describe the assignment/repo itself, not the running
  app the user was looking at, which is what the feedback was about.
- **Font pairing**: replaced the default Geist Sans/Mono with Sora
  (`font-display` — headings, hero text) and Plus Jakarta Sans (body/UI
  text), both via `next/font/google`. A deliberately more characterful,
  less "every Next.js starter looks like this" pairing, while keeping
  Jakarta's readability for dense question/answer text.
- **Motion and interactivity**, added consistently rather than piecemeal:
  a slow-spinning dashed ring + gradient badge behind the hero icons on
  the upload/processing screens, a soft blurred gradient background wash,
  hover-lift + shadow on every interactive card/button (dropzones, file
  previews, question cards, the grade button), press feedback
  (`active:scale-95`-style) on buttons, a smooth CSS-grid-based accordion
  expand/collapse on `QuestionCard` (swapped from instant show/hide, which
  doesn't animate), and the active processing stage now gets a highlighted
  row background instead of just a bigger dot.
- Verified visually via the same headless-Chromium screenshot approach as
  every prior milestone (upload empty/filled, button hover state,
  mid-processing, full results) against the already-running dev server —
  zero console errors, hot-reload picked up every change live. All three
  screens confirmed to no longer mention "VedaAI" anywhere.

**Verification:** `npm run typecheck && npm run lint && npm run test &&
npm run build` all clean, 71 tests unaffected (UI-only change set).

## Feature addition — whole-paper total marks

User's ask: analyze the question paper's own marks pattern and give a
total score across the whole assessment, not just per-question marks.

Closed a real gap this surfaced: `evaluationPrompt` was already defaulting
every question to 10 max marks whenever `Question.maxMarks` was unset —
which was *always*, since nothing ever actually populated it from the
paper's own printed marks (e.g. "[5]", "(10 marks)"). A "total" computed
from that would have been meaningless for any real exam with a varied
marks scheme.

- `lib/extraction/question-marks.ts`: `extractMaxMarks()` — a deterministic
  regex for a trailing `[5]` / `(5 marks)` / `[3M]` annotation. Requires
  the bracket/paren content to start with a digit, so a genuine
  parenthetical like "(with an example)" is never mistaken for marks.
  Applied as a post-process pass in `question-parser.ts` once each
  question's full text (including continuation lines) is assembled —
  doing it inline per-line wouldn't see marks printed after a multi-line
  question.
- `lib/ai/prompts.ts`: tightened `QUESTION_EXTRACTION_PROMPT`'s wording to
  explicitly ask the AI-fallback path to detect the same marks pattern,
  for parity with the deterministic path. Also replaced the
  `evaluationPrompt`'s hardcoded default-10 with a shared
  `DEFAULT_MAX_MARKS` constant (single source of truth with the total
  computation below, rather than two magic 10s that could drift apart).
- `lib/evaluation/total-marks.ts`: `computeTotalMarks()` — sums `earned`
  across all evaluations and `possible` across *all* questions, not just
  graded ones. An unanswered/ungraded question contributes 0 earned but
  still adds its max marks to `possible`, matching how a real exam total
  works (an unanswered 5-mark question doesn't shrink the paper to 95
  marks, it's a 0/5 within a 100-mark paper).
- `components/assessment/TotalMarksBadge.tsx`: a prominent gradient banner
  above the question list, colored by percentage (same green/amber/red
  bands as `StatusPill`). Renders nothing until at least one evaluation
  exists — consistent with grading being on-demand, never automatic.

**Verification.** Real extraction confirmed first: re-ran the actual
pipeline against a question paper with `[2]`/`(5 marks)`/`[3]`/`[3]`
annotations — the parser recovered exactly `2, 5, 3, 3`, not a flat
default. Grading itself hit the Gemini free-tier's 20-requests/day quota
partway through this session's extensive testing (a real, expected limit,
not a bug — and it exercised the error-handling path correctly: a friendly
"AI grading failed" message, 502 status, nothing raw leaked). Rather than
wait out the quota, verified the total-marks UI by mocking `/api/process`
and `/api/evaluate` responses in Playwright (using the exact marks values
the real extraction had just confirmed) — the badge rendered **9/13**
exactly matching the hand-computed expectation (2/2 + 4/5 + 3/3 + the
unanswered question's 0/3), with the unanswered question correctly
excluded from grading yet still counted in the total's denominator.

**Verification (automated):** `npm run typecheck && npm run lint && npm run test
&& npm run build` all clean — **83 tests** (12 new: 6 for
`extractMaxMarks`, 4 for `computeTotalMarks`, 2 integration cases in
`question-parser.test.ts`). Largest new file: 26 lines
(`TotalMarksBadge.tsx`).

## Feature refinement — choices and the paper's own stated total

Immediate follow-up from the user: the total should also account for
questions with a printed choice (e.g. "5(a) OR 5(b), attempt one") and use
the paper's own stated total rather than always summing per-question
marks.

- `lib/extraction/paper-total-marks.ts`: `extractPaperTotalMarks()` —
  deterministic regex for a "Total Marks: 100" / "Maximum Marks: 80"
  header, searched only within the first ~400 characters of the extracted
  text (headers are always near the top; this also avoids matching an
  unrelated number that happens to sit near the words "total"/"marks"
  somewhere deep in the questions). New `AssessmentResult.paperTotalMarks`
  field carries it through when found; `computeTotalMarks()` treats it as
  authoritative over any per-question sum when present.
- Chose *not* to attempt general "answer any N of M questions" prose-
  instruction parsing — real papers phrase this too inconsistently for
  reliable regex, and reaching for an extra AI call just to parse
  instructions would cut against "minimize LLM calls." Scoped instead to
  the single most common, reliably deterministic real pattern: an explicit
  `"5(a) OR 5(b)"` choice between two adjacent alternatives — the
  `OR_LINE_PATTERN` in `question-patterns.ts` matches a standalone "OR"
  line (optionally dashed: `-- OR --`) and nothing else, so a genuine
  sentence containing the word "or" is never mistaken for a choice marker.
  `question-parser.ts` links the two questions via a shared
  `Question.choiceGroup` id when this fires.
- `computeTotalMarks()` rewritten to group by `choiceGroup` before summing:
  each group contributes its max marks to `possible` exactly once (not
  once per alternative), and `earned` takes the *best* mark among whichever
  group members were actually graded — protects against double-counting
  if a student answers both sides of a choice they weren't supposed to.
- UI: an unanswered question whose choice partner *was* answered no longer
  shows the alarming "Unanswered" pill — `StatusPill` shows "Optional —
  not needed" instead, and the expanded card explains why, via a new
  `isSkippedByChoice()` check in `QuestionAccordion` (only true when the
  question has a `choiceGroup` and a sibling in it was actually mapped).

**Verification.** Real, non-mocked extraction against a fresh PDF fixture
containing all three patterns together ("Total Marks: 100" header, a
`5(a)`/`OR`/`5(b)` choice pair with `[10]` each, plus `[2]`/`(5 marks)` on
two ordinary questions) — ran `extractQuestions` directly via `tsx`
(bypassing the API route, since Gemini's free-tier daily quota was fully
exhausted by this point in the session and a full `/api/process` call
would have failed at the always-AI answer-extraction step regardless of
anything being tested here). Recovered exactly: marks `2, 5, 10, 10`;
`5(a)` and `5(b)` sharing one `choiceGroup`; `paperTotalMarks: 100`. All
three new behaviors confirmed against real deterministic parsing, not
just unit-test fixtures.

**Verification (automated):** `npm run typecheck && npm run lint && npm run test
&& npm run build` all clean — **95 tests** (12 new: 4 for
`extractPaperTotalMarks`, 3 for choice-group parsing, 3 for
`computeTotalMarks`'s choice-group/override handling, 2 wiring checks in
`process-assessment.test.ts`/`extract-questions.test.ts`). Largest touched
file: 87 lines (`question-parser.ts`).

## Feature — multiple images per document

User's ask: let the upload accept multiple images (photographed pages),
not just one PDF or one image, per document.

**Design decision made before writing any code, and why it matters.**
Considered two approaches:
- *Combine images into one PDF server-side* (using `pdf-lib`, already a
  dependency for test fixtures) before handing it to the existing
  PDF-only pipeline. Minimal changes to extraction/AI/mapping/viewer —
  but creates a real sync problem: the client only has the *original*
  image files, not the server's combined PDF, so the viewer couldn't
  reopen the exact document the AI actually analyzed without the server
  sending the assembled PDF back. Also `pdf-lib` can't embed WebP, so
  multi-image uploads would silently lose WebP support.
- *Generalize the document model itself* to carry one-or-more parts
  (`FileInput = { parts: { buffer, mimeType }[], name }`) — a PDF is
  still just one part (pages live inside it); multiple images become
  multiple parts, one per page. Chosen instead: Gemini's `generateContent`
  already accepts several inline parts in one call, so no image→PDF
  conversion is needed for the AI side at all; the client already holds
  the original image files it uploaded, so the viewer can build blob URLs
  straight from them with page numbers matching by construction (same
  array, same order, both sides); and no new runtime dependency or format
  limitation. Touches more files, but every change is small and
  mechanical — judged worth it over the more contained-looking but
  actually-more-fragile PDF-combination path.
- Client-side page-count preview (`FileDropzone`) only runs for a single
  PDF — for multiple images there's nothing to compute (each file is
  already exactly one page).

**What changed, by layer:**
- `lib/validation/file-validation.ts`: `FileInput` generalized to
  `{ parts: FilePart[]; name }`. New `validateFileInput()` validates every
  part and rejects mixing a PDF with anything else (a PDF is a complete
  document on its own).
- `lib/ai/client.ts`: `toPart` → `toParts`, flat-mapped across every part
  of every document sent — Gemini receives N inline image parts (or the
  one PDF part) in the same `generateContent` call it always made.
- `lib/ai/prompts.ts`: `ANSWER_EXTRACTION_PROMPT` now explicitly tells the
  model that multiple images arrive as sequential pages 1, 2, 3… in the
  order given, so `AnswerRegion.page` lines up with the array order the
  client already has.
- `lib/extraction/extract-questions.ts`: the "try the deterministic parser"
  branch now only fires for the single-PDF case
  (`parts.length === 1 && parts[0].mimeType === "application/pdf"`) —
  multiple images always go through the AI fallback, which is correct
  since there's no embedded text to read deterministically from a photo.
- `app/api/process/route.ts`: reads every file under a field name via
  `form.getAll` (not `form.get`) — one document's pages can now arrive as
  several form-data entries under the same field.
- `components/viewer/ImageViewer.tsx`: generalized from one image to
  `imageUrls: string[]`, reusing the exact same region/page-navigation
  pattern `PdfViewer` already had (`pagesForRegions`/`regionsByPage`) — a
  single image is now just the one-URL case of the same component, so
  there's no separate "multi-image viewer" to maintain.
- `lib/state/assessment-store.tsx` / `use-process-assessment.ts`: the
  answer-sheet file becomes `{ urls: string[]; mimeType }`; `submit()`
  takes `File[]` per document and creates one blob URL per file, in the
  same order they were uploaded (matching the page numbers Gemini assigned).
- `components/upload/FileDropzone.tsx` + new `MultiFilePreview.tsx`: the
  dropzone now has three states (empty / one file / several files), accepts
  drag-and-drop of multiple files, and rejects a PDF mixed with images
  client-side with an immediate, specific message — the server re-validates
  the same rule authoritatively via `validateFileInput`. Per-file removal
  and a "Change" reselect action in the multi-file state.

**Verification.** Real, non-mocked exercise of the whole path: selected
three PNG images for the answer sheet via a real `setInputFiles` multi-
selection, confirmed the preview showed "3 images selected" with per-page
labels, removed one (correctly dropped to 2, correctly re-rendered as the
multi-file list rather than the single-file card), then reselected down to
exactly one file and confirmed it correctly switched back to the ordinary
single-file preview card (three-state branching all exercised). Confirmed
the mixed PDF+image case is rejected immediately with the intended message,
never reaching the server. Then ran a real submission (one PDF question
paper + two PNG images as the answer sheet) against the live dev server —
the question paper parsed deterministically as before, and the pipeline
correctly reached "Reading answer sheet" (proving both images arrived
server-side, were validated as one two-part document, and were handed to
Gemini) before failing at the *same*, already-documented, project-level
daily-quota wall — not a new failure, and proof the new code path is
reached and behaves correctly right up to the external limit.

**Verification (automated):** `npm run typecheck && npm run lint && npm run test
&& npm run build` all clean — **99 tests** (4 new: multi-part validation
cases in `file-validation.test.ts`, an AI-fallback case for multiple
photographed pages in `extract-questions.test.ts`). Largest touched file:
127 lines (`FileDropzone.tsx`, now handling three UI states).
