import type { Question } from "@/types/assessment";
import type { FileInput } from "@/lib/validation/file-validation";
import { geminiAnalyzer } from "@/lib/ai/gemini-analyzer";
import { extractPdfPageText } from "./pdf-text";
import { parseQuestions } from "./question-parser";
import { extractPaperTotalMarks } from "./paper-total-marks";

export type QuestionExtractionResult = { questions: Question[]; paperTotalMarks?: number };

/**
 * Deterministic parsing is tried first (and trusted whenever it finds at
 * least one question). AI is only used as a fallback: for image-based
 * question papers (no embedded PDF text) or a layout too complex for the
 * regex parser to recognize any question label at all.
 */
export async function extractQuestions(doc: FileInput): Promise<QuestionExtractionResult> {
  const isSinglePdf = doc.parts.length === 1 && doc.parts[0].mimeType === "application/pdf";
  if (isSinglePdf) {
    const pages = await extractPdfPageText(doc.parts[0].buffer);
    const rawText = pages.join("\n");
    const questions = parseQuestions(rawText);
    if (questions.length > 0) {
      return { questions, paperTotalMarks: extractPaperTotalMarks(rawText) };
    }
  }

  const extracted = await geminiAnalyzer.extractQuestionsFromDocument(doc);
  return { questions: extracted.map((q, index) => ({ id: `q-${index + 1}`, ...q })) };
}
