import type { Answer } from "@/types/assessment";
import type { FileInput } from "@/lib/validation/file-validation";
import { geminiAnalyzer } from "@/lib/ai/gemini-analyzer";

/**
 * The single handwriting pass over the answer sheet — one Gemini call,
 * never resent per question. Assigns stable ids the rest of the app can
 * reference (mappings, evaluations, UI selection).
 */
export async function extractAnswers(doc: FileInput): Promise<Answer[]> {
  const extracted = await geminiAnalyzer.extractAnswers(doc);
  return extracted.map((a, index) => ({ id: `a-${index + 1}`, ...a }));
}
