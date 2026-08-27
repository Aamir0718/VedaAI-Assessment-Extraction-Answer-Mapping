import { PDFDocument, StandardFonts } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { extractPdfPageText } from "@/lib/extraction/pdf-text";

async function makeTwoPagePdf(): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  const page1 = doc.addPage([400, 600]);
  page1.drawText("1. What is the capital of France?", { x: 50, y: 550, size: 12, font });

  const page2 = doc.addPage([400, 600]);
  page2.drawText("2. Define photosynthesis.", { x: 50, y: 550, size: 12, font });

  return Buffer.from(await doc.save());
}

describe("extractPdfPageText", () => {
  it("returns one text entry per page, in order", async () => {
    const pdf = await makeTwoPagePdf();
    const pages = await extractPdfPageText(pdf);

    expect(pages).toHaveLength(2);
    expect(pages[0]).toContain("What is the capital of France?");
    expect(pages[1]).toContain("Define photosynthesis.");
  });

  it("returns an empty string for a page with no text", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([400, 600]);
    const pages = await extractPdfPageText(Buffer.from(await doc.save()));

    expect(pages).toEqual([""]);
  });
});
