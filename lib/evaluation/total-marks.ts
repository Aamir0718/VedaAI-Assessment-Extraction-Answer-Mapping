import type { Evaluation, Question } from "@/types/assessment";
import { baseNumber } from "@/lib/extraction/choice-groups";

/** Used only when neither the question paper nor the AI extraction detected a mark value. */
export const DEFAULT_MAX_MARKS = 10;

export type TotalMarks = { earned: number; possible: number };

type Alternative = { earned: number; possible: number; attempted: boolean };

/** Groups questions sharing a `choiceGroup` together; every other question is its own solo cluster. */
function clusterByChoice(questions: Question[]): Question[][] {
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
 * Within one choice cluster, figures out what's actually being chosen
 * between. Two real patterns look identical at the `choiceGroup` level
 * but score differently:
 *  - Whole questions ("Q1(a)+Q1(b) OR Q2(a)+Q2(b)") — multiple base
 *    numbers present, so each base's sub-parts are grouped and *summed*
 *    into one alternative (answering Q1 means both 1(a) and 1(b)).
 *  - Sub-parts of the same question ("5(a) OR 5(b)") — only one base
 *    number in the whole cluster, so each sub-part stands on its own as
 *    an alternative rather than being summed with its sibling.
 */
function splitIntoAlternatives(cluster: Question[]): Question[][] {
  const distinctBases = new Set(cluster.map((q) => baseNumber(q.number)));
  if (distinctBases.size === 1) return cluster.map((q) => [q]);

  const byBase = new Map<string, Question[]>();
  for (const q of cluster) byBase.set(baseNumber(q.number), [...(byBase.get(baseNumber(q.number)) ?? []), q]);
  return [...byBase.values()];
}

function scoreAlternative(parts: Question[], evalByQuestionId: Map<string, Evaluation>): Alternative {
  let earned = 0;
  let possible = 0;
  let attempted = false;
  for (const part of parts) {
    const evaluation = evalByQuestionId.get(part.id);
    if (evaluation) {
      earned += evaluation.marks;
      attempted = true;
    }
    possible += part.maxMarks ?? evaluation?.maxMarks ?? DEFAULT_MAX_MARKS;
  }
  return { earned, possible, attempted };
}

/**
 * Sums marks across the whole paper. A printed choice ("Q1 OR Q2") expects
 * one *whole* alternative to be attempted — every sub-part of it, not just
 * one — so each alternative is scored as the sum of its own parts, and
 * only the better-scoring whole alternative counts if the student
 * (incorrectly) answered both sides; the other is neither graded nor
 * double-counted. A question with no choice is just a cluster of one
 * alternative, so the same logic covers ordinary questions unchanged. An
 * unattempted/ungraded alternative still contributes its max marks to
 * `possible` (0 earned) — the same way a real exam total works.
 * `paperTotalMarks`, when the paper prints its own stated total, overrides
 * the summed `possible` entirely — more reliable than any computed sum.
 */
export function computeTotalMarks(
  questions: Question[],
  evaluations: Evaluation[],
  paperTotalMarks?: number
): TotalMarks {
  const evalByQuestionId = new Map(evaluations.map((e) => [e.questionId, e]));

  let earned = 0;
  let possible = 0;
  for (const cluster of clusterByChoice(questions)) {
    const alternatives = splitIntoAlternatives(cluster).map((parts) => scoreAlternative(parts, evalByQuestionId));
    const attempted = alternatives.filter((a) => a.attempted);
    const best =
      attempted.length > 0 ? attempted.reduce((a, b) => (b.earned > a.earned ? b : a)) : alternatives[0];
    earned += best.earned;
    possible += best.possible;
  }

  return { earned, possible: paperTotalMarks ?? possible };
}
