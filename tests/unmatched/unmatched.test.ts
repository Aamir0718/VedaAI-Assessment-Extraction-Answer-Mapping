import { describe, expect, it, vi } from "vitest";
import { mapAnswers } from "@/lib/mapping/map-answers";
import { getUnmappedAnswers } from "@/lib/mapping/mapping-status";
import { answer, question } from "../fixtures/mapping-fixtures";

describe("unmatched answers", () => {
  it("marks an answer unmapped rather than guessing when AI itself is unsure", async () => {
    const questions = [question("1"), question("2")];
    // 3 unlabeled answers vs 2 remaining questions -> count mismatch -> AI path.
    const answers = [
      answer("a-1", "..."),
      answer("a-2", "..."),
      answer("a-3", "unrelated scribble"),
    ];
    const resolveAmbiguousMappings = vi.fn().mockResolvedValue([
      { answerId: "a-1", questionId: "q-1", confidence: 0.7, method: "semantic" },
      { answerId: "a-2", questionId: "q-2", confidence: 0.65, method: "semantic" },
      { answerId: "a-3", confidence: 0, method: "unmapped" },
    ]);

    const mappings = await mapAnswers(questions, answers, { resolveAmbiguousMappings });

    expect(mappings).toHaveLength(3); // never silently dropped
    const a3 = mappings.find((m) => m.answerId === "a-3");
    expect(a3?.method).toBe("unmapped");
    expect(a3?.questionId).toBeUndefined();
    expect(getUnmappedAnswers(answers, mappings).map((a) => a.id)).toEqual(["a-3"]);
  });

  it("treats a hallucinated question id not among the candidates as unmapped", async () => {
    const questions = [question("1")];
    const answers = [answer("a-1", "..."), answer("a-2", "...")]; // 2 vs 1 -> AI path
    const resolveAmbiguousMappings = vi.fn().mockResolvedValue([
      { answerId: "a-1", questionId: "q-does-not-exist", confidence: 0.9, method: "semantic" },
      { answerId: "a-2", confidence: 0, method: "unmapped" },
    ]);

    const mappings = await mapAnswers(questions, answers, { resolveAmbiguousMappings });

    expect(mappings.find((m) => m.answerId === "a-1")).toMatchObject({ method: "unmapped" });
  });
});
