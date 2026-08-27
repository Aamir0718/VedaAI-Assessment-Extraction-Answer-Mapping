import { z } from "zod";
import type { NextRequest } from "next/server";
import { evaluateAssessment } from "@/lib/evaluation/evaluate";
import { geminiAnalyzer } from "@/lib/ai/gemini-analyzer";
import { AiOutputError } from "@/lib/ai/types";

// Optional, secondary step — deliberately separate from /api/process so
// grading can never delay mapping/highlighting, and only runs when the
// teacher actually asks for it.
export const runtime = "nodejs";
export const maxDuration = 30;

const requestSchema = z.object({
  questions: z.array(z.object({ id: z.string(), number: z.string(), text: z.string(), maxMarks: z.number().optional() })),
  answers: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      detectedQuestionNumber: z.string().optional(),
      regions: z.array(z.object({ page: z.number(), x: z.number(), y: z.number(), width: z.number(), height: z.number() })),
    })
  ),
  mappings: z.array(
    z.object({
      answerId: z.string(),
      questionId: z.string().optional(),
      confidence: z.number(),
      method: z.enum(["explicit-label", "normalized-label", "positional", "semantic", "unmapped"]),
    })
  ),
});

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const { questions, answers, mappings } = parsed.data;
    const evaluations = await evaluateAssessment(questions, answers, mappings, geminiAnalyzer);
    return Response.json({ evaluations });
  } catch (err) {
    console.error("evaluateAssessment failed:", err);
    const message = err instanceof AiOutputError ? "AI grading failed. Please try again." : "Something went wrong while grading.";
    return Response.json({ error: message }, { status: 502 });
  }
}
