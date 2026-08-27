import { describe, expect, it } from "vitest";
import { computeTotalMarks, DEFAULT_MAX_MARKS } from "@/lib/evaluation/total-marks";
import { question } from "../fixtures/mapping-fixtures";

function evaluation(questionId: string, marks: number, maxMarks: number) {
  return { questionId, marks, maxMarks, feedback: "..." };
}

describe("computeTotalMarks", () => {
  it("sums earned and possible marks across all graded questions", () => {
    const questions = [
      { ...question("1"), maxMarks: 2 },
      { ...question("2"), maxMarks: 5 },
    ];
    const evaluations = [evaluation("q-1", 2, 2), evaluation("q-2", 3, 5)];

    expect(computeTotalMarks(questions, evaluations)).toEqual({ earned: 5, possible: 7 });
  });

  it("counts an unanswered/ungraded question as 0 earned but still contributes its max marks", () => {
    const questions = [
      { ...question("1"), maxMarks: 2 },
      { ...question("2"), maxMarks: 5 }, // never graded (unanswered)
    ];
    const evaluations = [evaluation("q-1", 2, 2)];

    expect(computeTotalMarks(questions, evaluations)).toEqual({ earned: 2, possible: 7 });
  });

  it("falls back to the shared default when a question has no detected marks at all", () => {
    const questions = [question("1")]; // no maxMarks printed/detected
    const evaluations = [evaluation("q-1", 8, DEFAULT_MAX_MARKS)];

    expect(computeTotalMarks(questions, evaluations)).toEqual({
      earned: 8,
      possible: DEFAULT_MAX_MARKS,
    });
  });

  it("returns zero/zero when there is nothing to grade", () => {
    expect(computeTotalMarks([], [])).toEqual({ earned: 0, possible: 0 });
  });

  it("counts an OR choice group's marks only once, not for both alternatives", () => {
    const a = { ...question("5(a)"), maxMarks: 5, choiceGroup: "g1" };
    const b = { ...question("5(b)"), maxMarks: 5, choiceGroup: "g1" };
    const other = { ...question("6"), maxMarks: 5 };
    // Student answered 5(a) only, per the choice — 5(b) is legitimately skipped.
    const evaluations = [evaluation("q-5(a)", 4, 5), evaluation("q-6", 3, 5)];

    // possible = 5 (one from the choice group) + 5 (question 6) = 10, not 15.
    expect(computeTotalMarks([a, b, other], evaluations)).toEqual({ earned: 7, possible: 10 });
  });

  it("takes the better mark if a student answers both sides of a choice group", () => {
    const a = { ...question("5(a)"), maxMarks: 5, choiceGroup: "g1" };
    const b = { ...question("5(b)"), maxMarks: 5, choiceGroup: "g1" };
    const evaluations = [evaluation("q-5(a)", 3, 5), evaluation("q-5(b)", 4, 5)];

    expect(computeTotalMarks([a, b], evaluations)).toEqual({ earned: 4, possible: 5 });
  });

  it("uses the paper's own printed total instead of summing questions when given", () => {
    const questions = [{ ...question("1"), maxMarks: 2 }, { ...question("2"), maxMarks: 5 }];
    const evaluations = [evaluation("q-1", 2, 2)];

    expect(computeTotalMarks(questions, evaluations, 100)).toEqual({ earned: 2, possible: 100 });
  });

  it("sums a whole attempted alternative's own parts, not just its best single sub-part", () => {
    // "Q1(a)+Q1(b) OR Q2(a)+Q2(b)" — a real university-paper pattern: you
    // answer ONE FULL question (both its parts), not one sub-part of it.
    const q1a = { ...question("1(a)"), maxMarks: 10, choiceGroup: "g1" };
    const q1b = { ...question("1(b)"), maxMarks: 10, choiceGroup: "g1" };
    const q2a = { ...question("2(a)"), maxMarks: 10, choiceGroup: "g1" };
    const q2b = { ...question("2(b)"), maxMarks: 10, choiceGroup: "g1" };
    // Student answered only Q1 (both parts) — Q2 wasn't attempted at all.
    const evaluations = [evaluation("q-1(a)", 5, 10), evaluation("q-1(b)", 4, 10)];

    expect(computeTotalMarks([q1a, q1b, q2a, q2b], evaluations)).toEqual({ earned: 9, possible: 20 });
  });

  it("picks the higher-scoring FULL alternative when both whole questions are answered", () => {
    const q1a = { ...question("1(a)"), maxMarks: 10, choiceGroup: "g1" };
    const q1b = { ...question("1(b)"), maxMarks: 10, choiceGroup: "g1" };
    const q2a = { ...question("2(a)"), maxMarks: 10, choiceGroup: "g1" };
    const q2b = { ...question("2(b)"), maxMarks: 10, choiceGroup: "g1" };
    // Q1 totals 9 (5+4), Q2 totals 15 (8+7) — Q2 should win, not the
    // single highest sub-part mark across all four.
    const evaluations = [
      evaluation("q-1(a)", 5, 10),
      evaluation("q-1(b)", 4, 10),
      evaluation("q-2(a)", 8, 10),
      evaluation("q-2(b)", 7, 10),
    ];

    expect(computeTotalMarks([q1a, q1b, q2a, q2b], evaluations)).toEqual({ earned: 15, possible: 20 });
  });

  it("matches the real BCS515D paper: five independent module choices, only attempted sides count", () => {
    const modules = [1, 3, 5, 7, 9].flatMap((n) => {
      const group = `g${n}`;
      return [
        { ...question(`${n}(a)`), maxMarks: 10, choiceGroup: group },
        { ...question(`${n}(b)`), maxMarks: 10, choiceGroup: group },
        { ...question(`${n + 1}(a)`), maxMarks: 10, choiceGroup: group },
        { ...question(`${n + 1}(b)`), maxMarks: 10, choiceGroup: group },
      ];
    });
    // One full question answered per module (1, 3, 5, 7, 9 — not their pairs).
    const evaluations = [1, 3, 5, 7, 9].flatMap((n) => [
      evaluation(`q-${n}(a)`, 5, 10),
      evaluation(`q-${n}(b)`, 4, 10),
    ]);

    expect(computeTotalMarks(modules, evaluations)).toEqual({ earned: 45, possible: 100 });
  });
});
