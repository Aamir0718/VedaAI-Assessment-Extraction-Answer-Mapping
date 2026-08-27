import { describe, expect, it, vi } from "vitest";
import { mapAnswers } from "@/lib/mapping/map-answers";
import { answer, question } from "../fixtures/mapping-fixtures";

describe("ambiguous mappings", () => {
  it("resolves what AI is confident about and marks the rest for review, never guessing", async () => {
    const questions = [question("4"), question("5")];
    // 3 unlabeled answers vs 2 questions -> count mismatch -> genuinely ambiguous, AI path.
    const answers = [answer("a-1", "..."), answer("a-2", "..."), answer("a-3", "...")];
    const resolveAmbiguousMappings = vi.fn().mockResolvedValue([
      { answerId: "a-1", questionId: "q-4", confidence: 0.55, method: "semantic" },
      { answerId: "a-2", confidence: 0, method: "unmapped" },
      { answerId: "a-3", confidence: 0, method: "unmapped" },
    ]);

    const mappings = await mapAnswers(questions, answers, { resolveAmbiguousMappings });

    expect(mappings).toHaveLength(3);
    expect(mappings.filter((m) => m.method === "unmapped")).toHaveLength(2);
    const confident = mappings.find((m) => m.method === "semantic");
    expect(confident?.confidence).toBeLessThan(0.9); // low-confidence, flaggable for review — not hidden as solid
  });
});
