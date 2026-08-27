import { pdfjs } from "react-pdf";
import "./pdf-worker-setup";

/** Browser-only page count for a freshly selected file — used in the upload preview. */
export async function countPdfPages(file: File): Promise<number | null> {
  if (file.type !== "application/pdf") return null;
  try {
    const buffer = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: buffer }).promise;
    return doc.numPages;
  } catch {
    return null;
  }
}
