import { describe, expect, it, vi } from "vitest";
import { evaluateAssessment } from "@/lib/evaluation/evaluate";
import { answer, question } from "../fixtures/mapping-fixtures";

describe("evaluateAssessment", () => {
  it("grades only questions with a confidently-mapped answer, in one batched call", async () => {
    const questions = [question("1"), question("2"), question("3")];
    const answers = [answer("a-1", "Paris"), answer("a-2", "unrelated")];
    const mappings = [
      { answerId: "a-1", questionId: "q-1", confidence: 0.98, method: "explicit-label" as const },
      { answerId: "a-2", confidence: 0, method: "unmapped" as const }, // no questionId — must be skipped
      // question "2" has no mapping at all (unanswered) — must be skipped
    ];
    const evaluate = vi.fn().mockResolvedValue([
      { questionId: "q-1", marks: 8, maxMarks: 10, feedback: "Good." },
    ]);

    const result = await evaluateAssessment(questions, answers, mappings, { evaluate });

    expect(evaluate).toHaveBeenCalledTimes(1);
    expect(evaluate).toHaveBeenCalledWith([{ question: questions[0], answer: answers[0] }]);
    expect(result).toEqual([{ questionId: "q-1", marks: 8, maxMarks: 10, feedback: "Good." }]);
  });

  it("never calls the AI when there is nothing gradable", async () => {
    const evaluate = vi.fn();
    const result = await evaluateAssessment([question("1")], [], [], { evaluate });

    expect(evaluate).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("drops an evaluation for a question that wasn't actually sent", async () => {
    const questions = [question("1")];
    const answers = [answer("a-1", "...")];
    const mappings = [
      { answerId: "a-1", questionId: "q-1", confidence: 0.9, method: "explicit-label" as const },
    ];
    const evaluate = vi.fn().mockResolvedValue([
      { questionId: "q-1", marks: 5, maxMarks: 10, feedback: "Ok." },
      { questionId: "q-hallucinated", marks: 10, maxMarks: 10, feedback: "Bad." },
    ]);

    const result = await evaluateAssessment(questions, answers, mappings, { evaluate });

    expect(result).toEqual([{ questionId: "q-1", marks: 5, maxMarks: 10, feedback: "Ok." }]);
  });

  it("retries once for any pair the batched call silently omitted", async () => {
    const questions = [question("1"), question("2")];
    const answers = [answer("a-1", "..."), answer("a-2", "...")];
    const mappings = [
      { answerId: "a-1", questionId: "q-1", confidence: 0.9, method: "explicit-label" as const },
      { answerId: "a-2", questionId: "q-2", confidence: 0.9, method: "explicit-label" as const },
    ];
    const evaluate = vi
      .fn()
      // First call only grades q-1 — q-2 was requested but never came back.
      .mockResolvedValueOnce([{ questionId: "q-1", marks: 7, maxMarks: 10, feedback: "Ok." }])
      // Retry, sent only the missing pair, returns it this time.
      .mockResolvedValueOnce([{ questionId: "q-2", marks: 6, maxMarks: 10, feedback: "Also ok." }]);

    const result = await evaluateAssessment(questions, answers, mappings, { evaluate });

    expect(evaluate).toHaveBeenCalledTimes(2);
    expect(evaluate.mock.calls[1][0]).toEqual([{ question: questions[1], answer: answers[1] }]);
    expect(result).toEqual([
      { questionId: "q-1", marks: 7, maxMarks: 10, feedback: "Ok." },
      { questionId: "q-2", marks: 6, maxMarks: 10, feedback: "Also ok." },
    ]);
  });

  it("gives up gracefully if the retry still doesn't cover everything", async () => {
    const questions = [question("1"), question("2")];
    const answers = [answer("a-1", "..."), answer("a-2", "...")];
    const mappings = [
      { answerId: "a-1", questionId: "q-1", confidence: 0.9, method: "explicit-label" as const },
      { answerId: "a-2", questionId: "q-2", confidence: 0.9, method: "explicit-label" as const },
    ];
    const evaluate = vi
      .fn()
      .mockResolvedValueOnce([{ questionId: "q-1", marks: 7, maxMarks: 10, feedback: "Ok." }])
      .mockResolvedValueOnce([]); // still missing q-2 after the retry — no further attempts.

    const result = await evaluateAssessment(questions, answers, mappings, { evaluate });

    expect(evaluate).toHaveBeenCalledTimes(2);
    expect(result).toEqual([{ questionId: "q-1", marks: 7, maxMarks: 10, feedback: "Ok." }]);
  });
});
