# VedaAI Assessment Extraction & Answer Mapping

## Overview

A web app that lets a teacher upload a printed question paper and a
handwritten student answer sheet (PDF or images), then automatically:

- extracts every question in original order and numbering,
- transcribes handwritten answers and locates exactly where each one
  appears on the answer sheet,
- maps answers to questions deterministically wherever possible,
- and lets the teacher click a question to jump straight to the
  highlighted answer region — including across multiple pages.

Grading/feedback is an optional, secondary step that never blocks the core
mapping-and-highlighting workflow.

> Status: under active development, built milestone by milestone. See
> [context.md](./context.md) for a running log of what's done.

## Features

- [x] Upload with file-type/size validation and clear previews
- [x] Real, stage-by-stage processing progress (no generic spinner)
- [x] Deterministic question extraction (printed text), AI fallback for
      image-based/complex layouts
- [x] Handwriting transcription + bounding-box detection via Gemini
- [x] Deterministic-first answer mapping with a confidence model, AI only
      for genuinely ambiguous cases, never a silent drop
- [x] Multi-page answer support with region-by-region navigation
- [x] Click-a-question → jump-to-highlight results viewer
- [ ] Optional async grading (marks + feedback)

(Checklist fills in as milestones complete.)

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
   document has no usable embedded text).
3. Extract answers — one Gemini call over the full answer sheet, returning
   transcribed text + normalized bounding boxes per region.
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

Covered by the test corpus in `tests/`: sequential answers, out-of-order
answers, sub-questions (`11(a)`/`11(b)`), unanswered questions, unmatched
answers, multi-page answers, missing question labels, ambiguous mappings,
and coordinate conversion.

## Performance Decisions

One extraction pass per document, batched AI calls for mapping fallback and
grading, streamed progress instead of polling — see the plan for the full
list of tradeoffs.

## Tech Stack

Next.js (App Router, TypeScript), Tailwind CSS, `pdfjs-dist` +
`react-pdf` for PDF text extraction/rendering, `@google/generative-ai`
(Gemini) for vision, `zod` for schema validation, `vitest` for tests.

## Local Setup

```bash
npm install
cp .env.example .env.local   # then add your GEMINI_API_KEY
npm run dev
```

## Environment Variables

See [.env.example](./.env.example).

## Testing

```bash
npm run typecheck
npm run lint
npm run test
```

Mapping, parsing, and coordinate logic are unit-tested without any network
call (mocked AI output).

## Deployment

Deployable as a standard Next.js app (e.g. Vercel). Details finalized in
the hardening milestone.

## Limitations

Documented as they're discovered — see `context.md`.

## Future Improvements

TBD.
