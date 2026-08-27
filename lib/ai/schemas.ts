import { z } from "zod";

// Schemas for validating raw Gemini JSON output before it's trusted anywhere
// else in the app. Kept minimal on purpose — no reasoning/explanation
// fields are requested from the model, so none are validated here.

export const extractedQuestionSchema = z.object({
  number: z.string().min(1),
  text: z.string().min(1),
  maxMarks: z.number().positive().optional(),
});
export const extractedQuestionsSchema = z.array(extractedQuestionSchema);

const answerRegionSchema = z.object({
  page: z.number().int().min(1),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
});

export const extractedAnswerSchema = z.object({
  text: z.string().min(1),
  detectedQuestionNumber: z.string().min(1).optional(),
  regions: z.array(answerRegionSchema).min(1),
});
export const extractedAnswersSchema = z.array(extractedAnswerSchema);

export const resolvedMappingSchema = z.object({
  answerId: z.string().min(1),
  questionId: z.string().min(1).optional(),
  confidence: z.number().min(0).max(1),
  method: z.enum(["semantic", "unmapped"]),
});
export const resolvedMappingsSchema = z.array(resolvedMappingSchema);

export const evaluationSchema = z.object({
  questionId: z.string().min(1),
  marks: z.number().min(0),
  maxMarks: z.number().positive(),
  feedback: z.string().min(1),
});
export const evaluationsSchema = z.array(evaluationSchema);
