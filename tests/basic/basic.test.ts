import { describe, expect, it, vi } from "vitest";
import { mapAnswers } from "@/lib/mapping/map-answers";
import { answer, question } from "../fixtures/mapping-fixtures";

describe("basic sequential answers", () => {
  it("maps explicitly labeled answers without calling AI", async () => {
    const questions = [question("1"), question("2"), question("3")];
    const answers = [
      answer("a-1", "Answer one", { detectedQuestionNumber: "1" }),
      answer("a-2", "Answer two", { detectedQuestionNumber: "2" }),
      answer("a-3", "Answer three", { detectedQuestionNumber: "3" }),
    ];
    const resolveAmbiguousMappings = vi.fn();

    const mappings = await mapAnswers(questions, answers, { resolveAmbiguousMappings });

    expect(mappings).toHaveLength(3);
    expect(mappings.every((m) => m.method === "explicit-label")).toBe(true);
    expect(resolveAmbiguousMappings).not.toHaveBeenCalled();
  });

  it("resolves unlabeled sequential answers via the positional fallback", async () => {
    const questions = [question("1"), question("2")];
    const answers = [answer("a-1", "First"), answer("a-2", "Second")];
    const resolveAmbiguousMappings = vi.fn();

    const mappings = await mapAnswers(questions, answers, { resolveAmbiguousMappings });

    expect(mappings.map((m) => m.questionId)).toEqual(["q-1", "q-2"]);
    expect(mappings.every((m) => m.method === "positional")).toBe(true);
    expect(resolveAmbiguousMappings).not.toHaveBeenCalled();
  });
});
