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
