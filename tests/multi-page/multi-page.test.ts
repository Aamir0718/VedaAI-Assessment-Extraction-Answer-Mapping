import { describe, expect, it, vi } from "vitest";
import { mapAnswers } from "@/lib/mapping/map-answers";
import { answer, question } from "../fixtures/mapping-fixtures";

describe("multi-page answers", () => {
  it("preserves every region of an answer spanning multiple pages through mapping", async () => {
    const questions = [question("7")];
    const regions = [
      { page: 3, x: 0.1, y: 0.6, width: 0.8, height: 0.3 },
      { page: 4, x: 0.1, y: 0.1, width: 0.8, height: 0.5 },
      { page: 5, x: 0.1, y: 0.1, width: 0.8, height: 0.2 },
    ];
    const longAnswer = answer("a-1", "Long essay answer", { detectedQuestionNumber: "7", regions });

    const mappings = await mapAnswers(questions, [longAnswer], {
      resolveAmbiguousMappings: vi.fn(),
    });

    expect(mappings[0]).toMatchObject({ questionId: "q-7", method: "explicit-label" });
    // Mapping is label-only; region data must pass through completely untouched.
    expect(longAnswer.regions).toEqual(regions);
    expect(longAnswer.regions.map((r) => r.page)).toEqual([3, 4, 5]);
  });
});
