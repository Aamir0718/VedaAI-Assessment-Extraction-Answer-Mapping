import type { Answer, AnswerMapping, Question } from "@/types/assessment";

const POSITIONAL_CONFIDENCE = 0.6;

/**
 * For answers with no usable label, deterministically pairs them in order
 * with the remaining unmapped questions (in original printed order) — but
 * only when the counts line up exactly. That's the common "wrote every
 * answer in order, never labelled them" case, and it's safe to resolve
 * without AI because there's no other candidate it could be.
 *
 * If the counts don't match, positional order alone isn't trustworthy
 * (e.g. a genuinely unanswered question sitting among unlabeled answers)
 * — nothing is guessed here, and those answers are left for the AI
 * semantic fallback, which can actually read what they say.
 */
export function positionalFallback(
  unlabeledAnswers: Answer[],
  remainingQuestions: Question[]
): AnswerMapping[] {
  if (unlabeledAnswers.length === 0) return [];
  if (unlabeledAnswers.length !== remainingQuestions.length) return [];

  return unlabeledAnswers.map((answer, index) => ({
    answerId: answer.id,
    questionId: remainingQuestions[index].id,
    confidence: POSITIONAL_CONFIDENCE,
    method: "positional" as const,
  }));
}
