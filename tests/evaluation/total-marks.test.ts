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
});
