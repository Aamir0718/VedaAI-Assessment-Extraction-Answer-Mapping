import type { Answer, AnswerMapping, Evaluation, Question } from "@/types/assessment";
import type { FileInput } from "@/lib/validation/file-validation";

/** Thrown when a model call fails or returns output that fails schema validation. */
export class AiOutputError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "AiOutputError";
  }
}

/**
 * Server-log-only detail string, safe to console.error alongside an
 * AiOutputError. `cause` is a plain constructor property here (not wired
 * through Node's built-in Error.cause), so a bare `console.error(err)` can
 * silently print just "AiOutputError: <message>" depending on how the
 * surrounding logger serializes it — this pulls the real underlying reason
 * (a Gemini SDK error, a Zod validation error, etc.) out explicitly so it
 * always survives.
 */
export function describeAiError(err: unknown): string {
  if (!(err instanceof AiOutputError) || err.cause === undefined) {
    return err instanceof Error ? err.message : String(err);
  }
  const cause = err.cause;
  const causeMessage = cause instanceof Error ? cause.message : JSON.stringify(cause);
  return `${err.message} — caused by: ${causeMessage}`;
}

/** AI-provided subset of a Question — id/order are assigned by our code. */
export type ExtractedQuestion = Omit<Question, "id">;

/** Mirrors QuestionExtractionResult, since this is the AI-fallback's equivalent of the deterministic parser's output. */
export type ExtractedQuestions = { questions: ExtractedQuestion[]; paperTotalMarks?: number };

/** AI-provided subset of an Answer — id is assigned by our code. */
export type ExtractedAnswer = Omit<Answer, "id">;

/** AI-provided mapping decision for one answer that survived deterministic matching. */
export type ResolvedMapping = Omit<AnswerMapping, "confidence"> & { confidence: number };

/**
 * Isolates the AI provider from the rest of the app. Every method does
 * exactly one Gemini call and returns schema-validated, minimal data — no
 * reasoning/explanation fields, nothing UI- or business-logic-shaped.
 */
export interface DocumentAnalyzer {
  /** Fallback only — used when deterministic PDF-text parsing isn't viable. */
  extractQuestionsFromDocument(doc: FileInput): Promise<ExtractedQuestions>;
  /** Always used — handwriting transcription + region detection. */
  extractAnswers(doc: FileInput): Promise<ExtractedAnswer[]>;
  /** Batched — all still-ambiguous answers resolved in one call. */
  resolveAmbiguousMappings(
    answers: Answer[],
    candidates: Question[]
  ): Promise<ResolvedMapping[]>;
  /**
   * Batched — all mapped question/answer pairs graded in one call. `doc`,
   * when available, is the original answer-sheet file(s) — grading then
   * re-examines the actual handwriting instead of trusting the transcribed
   * text alone (transcription can miss or misread content).
   */
  evaluate(
    pairs: { question: Question; answer: Answer }[],
    doc?: FileInput
  ): Promise<Evaluation[]>;
}
