import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import path from "node:path";
import { pathToFileURL } from "node:url";

let workerConfigured = false;

/** pdfjs-dist needs its worker/font-data script paths on Node — set once. */
function configurePdfjs() {
  if (workerConfigured) return;
  const base = path.join(process.cwd(), "node_modules/pdfjs-dist");
  GlobalWorkerOptions.workerSrc = pathToFileURL(
    path.join(base, "legacy/build/pdf.worker.mjs")
  ).href;
  workerConfigured = true;
}

/**
 * Returns the extracted text of each page, in printed order. An entry is
 * an empty string for a page with no embedded text (e.g. a scanned image) —
 * callers decide whether that warrants an AI fallback.
 */
export async function extractPdfPageText(buffer: Buffer): Promise<string[]> {
  configurePdfjs();
  const standardFontDataUrl = pathToFileURL(
    path.join(process.cwd(), "node_modules/pdfjs-dist/standard_fonts/")
  ).href;

  const doc = await getDocument({ data: new Uint8Array(buffer), standardFontDataUrl }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
    pages.push(text.trim());
  }
  return pages;
}
