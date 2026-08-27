import type { Question } from "@/types/assessment";

/** The leading digit run of a label — "11(a)" and "11(b)" share base "11". */
export function baseNumber(number: string): string {
  return number.match(/^\d+/)?.[0] ?? number;
}

/**
 * Links questions into choice groups wherever a standalone "OR" line
 * separated them — not just the single sub-part on each side, but every
 * sub-part belonging to the same printed question number. A real paper's
 * "OR" usually separates two *entire* alternatives (e.g. "Q1(a)+Q1(b) OR
 * Q2(a)+Q2(b)"), so this groups by contiguous "runs" of a shared base
 * number, always starting a fresh run right after "OR" even if the base
 * repeats (so "5(a) OR 5(b)" — an OR *within* one number — still links
 * correctly) — then links that new run with whichever run preceded it.
 */
export function applyChoiceGroups(questions: Question[], afterOr: boolean[]): Question[] {
  const runs: number[][] = [];
  questions.forEach((q, i) => {
    const base = baseNumber(q.number);
    const lastRun = runs.at(-1);
    const continuesLastRun = lastRun && baseNumber(questions[lastRun[0]].number) === base && !afterOr[i];
    if (continuesLastRun) lastRun.push(i);
    else runs.push([i]);
  });

  const result = questions.map((q) => ({ ...q }));
  for (let r = 1; r < runs.length; r++) {
    if (!afterOr[runs[r][0]]) continue;
    const groupId = result[runs[r - 1][0]].choiceGroup ?? result[runs[r - 1][0]].id;
    for (const index of [...runs[r - 1], ...runs[r]]) result[index].choiceGroup = groupId;
  }
  return result;
}
