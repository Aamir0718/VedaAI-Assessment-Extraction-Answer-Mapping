import { PDFDocument, StandardFonts } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { extractPdfPageText, joinTextItems } from "@/lib/extraction/pdf-text";

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

  it("keeps multiple printed lines on one page as separate lines, not collapsed", async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const page = doc.addPage([400, 600]);
    page.drawText("1. What is the capital of France?", { x: 50, y: 550, size: 12, font });
    page.drawText("2. Define photosynthesis.", { x: 50, y: 520, size: 12, font });

    const [pageText] = await extractPdfPageText(Buffer.from(await doc.save()));
    const lines = pageText.split("\n");

    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("capital of France");
    expect(lines[1]).toContain("Define photosynthesis");
  });

  it("rejects a corrupt/non-PDF buffer instead of hanging or crashing the process", async () => {
    const garbage = Buffer.from("this is not a pdf file at all, just plain bytes");
    await expect(extractPdfPageText(garbage)).rejects.toBeTruthy();
  });
});

describe("joinTextItems", () => {
  function textItem(str: string, y: number) {
    return { str, transform: [1, 0, 0, 1, 0, y] } as never;
  }

  it("joins items on the same baseline with a space", () => {
    expect(joinTextItems([textItem("Hello", 100), textItem("world", 100)])).toBe("Hello world");
  });

  it("inserts a newline when the baseline moves to a new line", () => {
    expect(joinTextItems([textItem("Line one", 100), textItem("Line two", 80)])).toBe(
      "Line one\nLine two"
    );
  });

  it("ignores marked-content items with no str", () => {
    expect(joinTextItems([textItem("Hello", 100), { type: "beginMarkedContent" } as never])).toBe(
      "Hello"
    );
  });
});
