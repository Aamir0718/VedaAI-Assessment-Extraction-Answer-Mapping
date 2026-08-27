import type { Evaluation, Question } from "@/types/assessment";

/** Used only when neither the question paper nor the AI extraction detected a mark value. */
export const DEFAULT_MAX_MARKS = 10;

export type TotalMarks = { earned: number; possible: number };

/** Groups questions sharing a `choiceGroup` together; every other question is its own solo group. */
function groupByChoice(questions: Question[]): Question[][] {
  const groups = new Map<string, Question[]>();
  const solo: Question[][] = [];
  for (const q of questions) {
    if (!q.choiceGroup) {
      solo.push([q]);
      continue;
    }
    groups.set(q.choiceGroup, [...(groups.get(q.choiceGroup) ?? []), q]);
  }
  return [...solo, ...groups.values()];
}

/**
 * Sums marks across the whole paper. An unanswered/ungraded question still
 * contributes its max marks to `possible` (0 earned) — the same way a real
 * exam total works. Alternative questions ("5(a) OR 5(b)") only count
 * once, using whichever was actually attempted, since the paper never
 * intended both to be answered. `paperTotalMarks`, when the paper prints
 * its own stated total, overrides the summed `possible` entirely — it's
 * more reliable than any per-question sum, choice-aware or not.
 */
export function computeTotalMarks(
  questions: Question[],
  evaluations: Evaluation[],
  paperTotalMarks?: number
): TotalMarks {
  const evalByQuestionId = new Map(evaluations.map((e) => [e.questionId, e]));

  let earned = 0;
  let possible = 0;
  for (const group of groupByChoice(questions)) {
    const graded = group.map((q) => evalByQuestionId.get(q.id)).filter((e): e is Evaluation => !!e);
    earned += graded.length > 0 ? Math.max(...graded.map((e) => e.marks)) : 0;
    possible += group[0].maxMarks ?? graded[0]?.maxMarks ?? DEFAULT_MAX_MARKS;
  }

  return { earned, possible: paperTotalMarks ?? possible };
}
