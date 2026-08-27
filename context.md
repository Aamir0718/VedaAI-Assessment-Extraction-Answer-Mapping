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
