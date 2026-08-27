import type { Answer, AnswerMapping, Question } from "@/types/assessment";
import { normalizeLabel } from "./normalize-label";

const EXPLICIT_CONFIDENCE = 0.98;
const NORMALIZED_CONFIDENCE = 0.9;

/**
 * Matches an answer to a question purely by its detected label. Tries an
 * exact string match first (method "explicit-label"), then falls back to
 * normalized-label equivalence (method "normalized-label", e.g. "Q11 (a)"
 * matching printed "11(a)"). Returns null — never a guess — when the
 * answer has no usable label or it matches no candidate question.
 */
export function explicitMatch(answer: Answer, questions: Question[]): AnswerMapping | null {
  const detected = answer.detectedQuestionNumber?.trim();
  if (!detected) return null;

  const exact = questions.find((q) => q.number.trim() === detected);
  if (exact) {
    return {
      answerId: answer.id,
      questionId: exact.id,
      confidence: EXPLICIT_CONFIDENCE,
      method: "explicit-label",
    };
  }

  const normalizedDetected = normalizeLabel(detected);
  if (!normalizedDetected) return null;

  const normalizedMatch = questions.find((q) => normalizeLabel(q.number) === normalizedDetected);
  if (!normalizedMatch) return null;

  return {
    answerId: answer.id,
    questionId: normalizedMatch.id,
    confidence: NORMALIZED_CONFIDENCE,
    method: "normalized-label",
  };
}
