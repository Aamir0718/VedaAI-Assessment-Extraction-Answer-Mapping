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
});
