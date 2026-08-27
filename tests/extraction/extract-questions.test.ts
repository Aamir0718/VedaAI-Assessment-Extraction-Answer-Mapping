import { PDFDocument, StandardFonts } from "pdf-lib";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FileInput } from "@/lib/validation/file-validation";

const extractQuestionsFromDocument = vi.fn();
vi.mock("@/lib/ai/gemini-analyzer", () => ({
  geminiAnalyzer: { extractQuestionsFromDocument },
}));

const { extractQuestions } = await import("@/lib/extraction/extract-questions");

async function makePdf(...lines: string[]): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([400, 600]);
  lines.forEach((line, i) => page.drawText(line, { x: 50, y: 550 - i * 20, size: 12, font }));
  return Buffer.from(await doc.save());
}

function pdfDoc(buffer: Buffer): FileInput {
  return { parts: [{ buffer, mimeType: "application/pdf" }], name: "q.pdf" };
}

describe("extractQuestions", () => {
  beforeEach(() => {
    extractQuestionsFromDocument.mockReset();
  });

  it("uses the deterministic parser and never calls AI when text is recognizable", async () => {
    const buffer = await makePdf("1. What is the capital of France?");
    const result = await extractQuestions(pdfDoc(buffer));

    expect(result.questions).toEqual([
      { id: "q-1", number: "1", text: "What is the capital of France?" },
    ]);
    expect(result.paperTotalMarks).toBeUndefined();
    expect(extractQuestionsFromDocument).not.toHaveBeenCalled();
  });

  it("also picks up a printed 'Total Marks' header alongside the deterministic parse", async () => {
    const buffer = await makePdf("Total Marks: 50", "1. What is the capital of France?");
    const result = await extractQuestions(pdfDoc(buffer));

    expect(result.paperTotalMarks).toBe(50);
  });

  it("falls back to AI when the PDF has no recognizable question labels", async () => {
    extractQuestionsFromDocument.mockResolvedValue([
      { number: "1", text: "Recovered by AI." },
    ]);
    const buffer = await makePdf("Just some prose, no numbering.");
    const result = await extractQuestions(pdfDoc(buffer));

    expect(extractQuestionsFromDocument).toHaveBeenCalledTimes(1);
    expect(result.questions).toEqual([{ id: "q-1", number: "1", text: "Recovered by AI." }]);
  });

  it("falls back to AI directly for a single image-based question paper", async () => {
    extractQuestionsFromDocument.mockResolvedValue([{ number: "1", text: "From image." }]);
    const result = await extractQuestions({
      parts: [{ buffer: Buffer.from("fake-image-bytes"), mimeType: "image/png" }],
      name: "q.png",
    });

    expect(extractQuestionsFromDocument).toHaveBeenCalledTimes(1);
    expect(result.questions).toEqual([{ id: "q-1", number: "1", text: "From image." }]);
  });

  it("falls back to AI directly for multiple photographed pages, never attempting PDF parsing", async () => {
    extractQuestionsFromDocument.mockResolvedValue([{ number: "1", text: "From photos." }]);
    const result = await extractQuestions({
      parts: [
        { buffer: Buffer.from("page-1"), mimeType: "image/jpeg" },
        { buffer: Buffer.from("page-2"), mimeType: "image/jpeg" },
      ],
      name: "q.jpg",
    });

    expect(extractQuestionsFromDocument).toHaveBeenCalledTimes(1);
    expect(result.questions).toEqual([{ id: "q-1", number: "1", text: "From photos." }]);
  });
});
