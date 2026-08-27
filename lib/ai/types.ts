import type { Answer, AnswerMapping, Evaluation, Question } from "@/types/assessment";
import type { FileInput } from "@/lib/validation/file-validation";

/** Thrown when a model call fails or returns output that fails schema validation. */
export class AiOutputError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "AiOutputError";
  }
}

/** AI-provided subset of a Question — id/order are assigned by our code. */
export type ExtractedQuestion = Omit<Question, "id">;

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
  extractQuestionsFromDocument(doc: FileInput): Promise<ExtractedQuestion[]>;
  /** Always used — handwriting transcription + region detection. */
  extractAnswers(doc: FileInput): Promise<ExtractedAnswer[]>;
  /** Batched — all still-ambiguous answers resolved in one call. */
  resolveAmbiguousMappings(
    answers: Answer[],
    candidates: Question[]
  ): Promise<ResolvedMapping[]>;
  /** Batched — all mapped question/answer pairs graded in one call. */
  evaluate(pairs: { question: Question; answer: Answer }[]): Promise<Evaluation[]>;
}
