import { describe, expect, it, vi } from "vitest";

const extractQuestions = vi.fn();
const extractAnswers = vi.fn();
vi.mock("@/lib/extraction/extract-questions", () => ({ extractQuestions }));
vi.mock("@/lib/extraction/extract-answers", () => ({ extractAnswers }));
vi.mock("@/lib/ai/gemini-analyzer", () => ({ geminiAnalyzer: {} }));

const { processAssessment } = await import("@/lib/processing/process-assessment");

const file = { buffer: Buffer.from("x"), mimeType: "application/pdf", name: "f.pdf" };

async function collect(files: Parameters<typeof processAssessment>[0]) {
  const events = [];
  for await (const event of processAssessment(files)) events.push(event);
  return events;
}

describe("processAssessment", () => {
  it("streams every stage in order and ends with the result", async () => {
    extractQuestions.mockResolvedValue({ questions: [{ id: "q-1", number: "1", text: "..." }] });
    extractAnswers.mockResolvedValue([
      { id: "a-1", text: "...", detectedQuestionNumber: "1", regions: [{ page: 1, x: 0, y: 0, width: 0.5, height: 0.1 }] },
    ]);

    const events = await collect({ questionPaper: file, answerSheet: file });

    expect(events.map((e) => e.type)).toEqual([
      "stage",
      "stage",
      "stage",
      "stage",
      "stage",
      "stage",
      "result",
    ]);
    const last = events[events.length - 1];
    expect(last).toMatchObject({ type: "result" });
    if (last.type === "result") {
      expect(last.result.questions).toHaveLength(1);
      expect(last.result.mappings[0]).toMatchObject({ method: "explicit-label" });
    }
  });

  it("includes the extracted question count in its stage label", async () => {
    extractQuestions.mockResolvedValue({
      questions: [
        { id: "q-1", number: "1", text: "..." },
        { id: "q-2", number: "2", text: "..." },
      ],
    });
    extractAnswers.mockResolvedValue([]);

    const events = await collect({ questionPaper: file, answerSheet: file });
    const countStage = events.find((e) => e.type === "stage" && e.id === "questions-extracted");
    expect(countStage).toMatchObject({ label: "Extracted 2 questions" });
  });

  it("carries paperTotalMarks through to the result when detected", async () => {
    extractQuestions.mockResolvedValue({
      questions: [{ id: "q-1", number: "1", text: "..." }],
      paperTotalMarks: 100,
    });
    extractAnswers.mockResolvedValue([]);

    const events = await collect({ questionPaper: file, answerSheet: file });
    const last = events.at(-1);
    if (last?.type === "result") {
      expect(last.result.paperTotalMarks).toBe(100);
    } else {
      throw new Error("expected a result event");
    }
  });

  it("yields a friendly error event instead of throwing when a step fails", async () => {
    extractQuestions.mockRejectedValue(new Error("pdfjs: corrupt PDF"));

    const events = await collect({ questionPaper: file, answerSheet: file });

    expect(events.at(-1)).toMatchObject({ type: "error" });
    const errorEvent = events.at(-1);
    if (errorEvent?.type === "error") {
      expect(errorEvent.message).not.toMatch(/pdfjs/i);
    }
  });
});
