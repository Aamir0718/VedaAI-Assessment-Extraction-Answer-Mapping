import { describe, expect, it, vi } from "vitest";

const extractAnswers = vi.fn();
vi.mock("@/lib/ai/gemini-analyzer", () => ({
  geminiAnalyzer: { extractAnswers },
}));

const { extractAnswers: extractAnswersFromSheet } = await import(
  "@/lib/extraction/extract-answers"
);

describe("extractAnswers", () => {
  it("assigns stable ids to each transcribed answer, in AI-returned order", async () => {
    extractAnswers.mockResolvedValue([
      { text: "Paris.", detectedQuestionNumber: "1", regions: [{ page: 1, x: 0, y: 0, width: 0.5, height: 0.1 }] },
      { text: "Plants convert light to energy.", regions: [{ page: 1, x: 0, y: 0.2, width: 0.5, height: 0.1 }] },
    ]);

    const result = await extractAnswersFromSheet({
      buffer: Buffer.from("fake-pdf-bytes"),
      mimeType: "application/pdf",
      name: "answers.pdf",
    });

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("a-1");
    expect(result[1].id).toBe("a-2");
    expect(result[0].detectedQuestionNumber).toBe("1");
  });
});
