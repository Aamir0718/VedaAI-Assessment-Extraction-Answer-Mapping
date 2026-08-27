import type { Evaluation, Question } from "@/types/assessment";

/** Used only when neither the question paper nor the AI extraction detected a mark value. */
export const DEFAULT_MAX_MARKS = 10;

export type TotalMarks = { earned: number; possible: number };

/**
 * Sums marks across every question, not just the graded ones — an
 * unanswered or ungraded question still contributes its max marks to the
 * total (as 0 earned), the same way a real exam total works.
 */
export function computeTotalMarks(questions: Question[], evaluations: Evaluation[]): TotalMarks {
  let earned = 0;
  let possible = 0;

  for (const question of questions) {
    const evaluation = evaluations.find((e) => e.questionId === question.id);
    earned += evaluation?.marks ?? 0;
    possible += question.maxMarks ?? evaluation?.maxMarks ?? DEFAULT_MAX_MARKS;
  }

  return { earned, possible };
}
