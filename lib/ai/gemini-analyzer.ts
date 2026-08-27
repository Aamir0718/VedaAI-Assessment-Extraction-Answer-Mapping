import type { Answer, Question } from "@/types/assessment";
import type { FileInput } from "@/lib/validation/file-validation";
import { generateJson } from "./client";
import {
  ambiguousMappingPrompt,
  ANSWER_EXTRACTION_PROMPT,
  evaluationPrompt,
  QUESTION_EXTRACTION_PROMPT,
} from "./prompts";
import {
  evaluationsSchema,
  extractedAnswersSchema,
  extractedQuestionsSchema,
  resolvedMappingsSchema,
} from "./schemas";
import type { DocumentAnalyzer, ExtractedAnswer, ExtractedQuestion, ResolvedMapping } from "./types";

/** Gemini-backed implementation of DocumentAnalyzer. One call per method. */
export const geminiAnalyzer: DocumentAnalyzer = {
  async extractQuestionsFromDocument(doc: FileInput): Promise<ExtractedQuestion[]> {
    return generateJson({
      prompt: QUESTION_EXTRACTION_PROMPT,
      files: [doc],
      schema: extractedQuestionsSchema,
    });
  },

  async extractAnswers(doc: FileInput): Promise<ExtractedAnswer[]> {
    return generateJson({
      prompt: ANSWER_EXTRACTION_PROMPT,
      files: [doc],
      schema: extractedAnswersSchema,
    });
  },

  async resolveAmbiguousMappings(
    answers: Answer[],
    candidates: Question[]
  ): Promise<ResolvedMapping[]> {
    if (answers.length === 0 || candidates.length === 0) return [];
    return generateJson({
      prompt: ambiguousMappingPrompt(answers, candidates),
      schema: resolvedMappingsSchema,
    });
  },

  async evaluate(pairs: { question: Question; answer: Answer }[]) {
    if (pairs.length === 0) return [];
    return generateJson({
      prompt: evaluationPrompt(pairs),
      schema: evaluationsSchema,
    });
  },
};
