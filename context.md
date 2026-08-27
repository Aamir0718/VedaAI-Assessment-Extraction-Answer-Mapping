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
