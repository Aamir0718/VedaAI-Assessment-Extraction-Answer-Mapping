import { PDFDocument, StandardFonts } from "pdf-lib";
import { beforeEach, describe, expect, it, vi } from "vitest";

const extractQuestionsFromDocument = vi.fn();
vi.mock("@/lib/ai/gemini-analyzer", () => ({
  geminiAnalyzer: { extractQuestionsFromDocument },
}));

const { extractQuestions } = await import("@/lib/extraction/extract-questions");

async function makePdfWithText(text: string): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([400, 600]);
  page.drawText(text, { x: 50, y: 550, size: 12, font });
  return Buffer.from(await doc.save());
}

describe("extractQuestions", () => {
  beforeEach(() => {
    extractQuestionsFromDocument.mockReset();
  });

  it("uses the deterministic parser and never calls AI when text is recognizable", async () => {
    const buffer = await makePdfWithText("1. What is the capital of France?");
    const result = await extractQuestions({ buffer, mimeType: "application/pdf", name: "q.pdf" });

    expect(result).toEqual([
      { id: "q-1", number: "1", text: "What is the capital of France?" },
    ]);
    expect(extractQuestionsFromDocument).not.toHaveBeenCalled();
  });

  it("falls back to AI when the PDF has no recognizable question labels", async () => {
    extractQuestionsFromDocument.mockResolvedValue([
      { number: "1", text: "Recovered by AI." },
    ]);
    const buffer = await makePdfWithText("Just some prose, no numbering.");
    const result = await extractQuestions({ buffer, mimeType: "application/pdf", name: "q.pdf" });

    expect(extractQuestionsFromDocument).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: "q-1", number: "1", text: "Recovered by AI." }]);
  });

  it("falls back to AI directly for image-based question papers", async () => {
    extractQuestionsFromDocument.mockResolvedValue([{ number: "1", text: "From image." }]);
    const result = await extractQuestions({
      buffer: Buffer.from("fake-image-bytes"),
      mimeType: "image/png",
      name: "q.png",
    });

    expect(extractQuestionsFromDocument).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: "q-1", number: "1", text: "From image." }]);
  });
});
