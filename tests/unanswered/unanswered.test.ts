import { describe, expect, it, vi } from "vitest";
import { mapAnswers } from "@/lib/mapping/map-answers";
import { getUnansweredQuestions } from "@/lib/mapping/mapping-status";
import { answer, question } from "../fixtures/mapping-fixtures";

describe("unanswered questions", () => {
  it("identifies questions with no mapped answer, without fabricating one", async () => {
    const questions = [question("1"), question("2"), question("3")];
    const answers = [answer("a-1", "Answer one", { detectedQuestionNumber: "1" })];

    const mappings = await mapAnswers(questions, answers, { resolveAmbiguousMappings: vi.fn() });

    expect(mappings).toHaveLength(1);
    const unanswered = getUnansweredQuestions(questions, mappings);
    expect(unanswered.map((q) => q.number)).toEqual(["2", "3"]);
  });

  it("reports no unanswered questions once every question has a mapped answer", async () => {
    const questions = [question("1"), question("2")];
    const answers = [
      answer("a-1", "Answer one", { detectedQuestionNumber: "1" }),
      answer("a-2", "Answer two", { detectedQuestionNumber: "2" }),
    ];

    const mappings = await mapAnswers(questions, answers, { resolveAmbiguousMappings: vi.fn() });

    expect(getUnansweredQuestions(questions, mappings)).toEqual([]);
  });
});
