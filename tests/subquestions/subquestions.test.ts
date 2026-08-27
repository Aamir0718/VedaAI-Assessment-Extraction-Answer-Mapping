import { describe, expect, it, vi } from "vitest";
import { mapAnswers } from "@/lib/mapping/map-answers";
import { answer, question } from "../fixtures/mapping-fixtures";

describe("labelled sub-questions", () => {
  it("treats 11(a) and 11(b) as independent questions and matches label variants", async () => {
    const questions = [question("11(a)"), question("11(b)")];
    const answers = [
      answer("a-1", "Part (a) answer", { detectedQuestionNumber: "11 (a)" }),
      answer("a-2", "Part (b) answer", { detectedQuestionNumber: "Q11(b)" }),
    ];

    const mappings = await mapAnswers(questions, answers, { resolveAmbiguousMappings: vi.fn() });

    expect(mappings.find((m) => m.answerId === "a-1")).toMatchObject({
      questionId: "q-11(a)",
      method: "normalized-label",
    });
    expect(mappings.find((m) => m.answerId === "a-2")).toMatchObject({
      questionId: "q-11(b)",
      method: "normalized-label",
    });
  });

  it("distinguishes roman-numeral sub-parts", async () => {
    const questions = [question("12(i)"), question("12(ii)")];
    const answers = [
      answer("a-1", "First part", { detectedQuestionNumber: "12(ii)" }),
      answer("a-2", "Second part", { detectedQuestionNumber: "12(i)" }),
    ];

    const mappings = await mapAnswers(questions, answers, { resolveAmbiguousMappings: vi.fn() });

    expect(mappings.find((m) => m.answerId === "a-1")?.questionId).toBe("q-12(ii)");
    expect(mappings.find((m) => m.answerId === "a-2")?.questionId).toBe("q-12(i)");
  });
});
