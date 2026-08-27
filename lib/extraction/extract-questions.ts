import type { Question } from "@/types/assessment";
import type { FileInput } from "@/lib/validation/file-validation";
import { geminiAnalyzer } from "@/lib/ai/gemini-analyzer";
import { extractPdfPageText } from "./pdf-text";
import { parseQuestions } from "./question-parser";

/**
 * Deterministic parsing is tried first (and trusted whenever it finds at
 * least one question). AI is only used as a fallback: for image-based
 * question papers (no embedded PDF text) or a layout too complex for the
 * regex parser to recognize any question label at all.
 */
export async function extractQuestions(doc: FileInput): Promise<Question[]> {
  if (doc.mimeType === "application/pdf") {
    const pages = await extractPdfPageText(doc.buffer);
    const parsed = parseQuestions(pages.join("\n"));
    if (parsed.length > 0) return parsed;
  }

  const extracted = await geminiAnalyzer.extractQuestionsFromDocument(doc);
  return extracted.map((q, index) => ({ id: `q-${index + 1}`, ...q }));
}
