import "@/lib/pdf/node-polyfills";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { TextItem, TextMarkedContent } from "pdfjs-dist/types/src/display/api";
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * pdfjs reports text as a flat run of items with no line breaks — joining
 * them with a plain space would collapse an entire page into one line.
 * Insert a newline whenever an item's baseline (transform[5]) jumps from
 * the previous one, which is how pdfjs itself signals a new visual line.
 */
export function joinTextItems(items: (TextItem | TextMarkedContent)[]): string {
  let text = "";
  let lastY: number | null = null;

  for (const item of items) {
    if (!("str" in item)) continue;
    const y = item.transform[5];
    if (lastY !== null && Math.abs(y - lastY) > 1) text += "\n";
    else if (text) text += " ";
    text += item.str;
    lastY = y;
  }

  return text.trim();
}

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
    pages.push(joinTextItems(content.items));
  }
  return pages;
}
