import { describe, expect, it, vi } from "vitest";
import { mapAnswers } from "@/lib/mapping/map-answers";
import { answer, question } from "../fixtures/mapping-fixtures";

describe("out-of-order answers", () => {
  it("maps correctly regardless of the order answers were written or extracted in", async () => {
    const questions = [question("1"), question("2"), question("3")];
    const answers = [
      answer("a-1", "Answer to Q3", { detectedQuestionNumber: "3" }),
      answer("a-2", "Answer to Q1", { detectedQuestionNumber: "1" }),
      answer("a-3", "Answer to Q2", { detectedQuestionNumber: "2" }),
    ];

    const mappings = await mapAnswers(questions, answers, { resolveAmbiguousMappings: vi.fn() });

    expect(mappings.find((m) => m.answerId === "a-1")?.questionId).toBe("q-3");
    expect(mappings.find((m) => m.answerId === "a-2")?.questionId).toBe("q-1");
    expect(mappings.find((m) => m.answerId === "a-3")?.questionId).toBe("q-2");
  });
});
