import { z } from "zod";
import type { NextRequest } from "next/server";
import { evaluateAssessment } from "@/lib/evaluation/evaluate";
import { geminiAnalyzer } from "@/lib/ai/gemini-analyzer";
import { AiOutputError, describeAiError } from "@/lib/ai/types";
import { validateFileInput } from "@/lib/validation/file-validation";
import { readDocument } from "@/lib/validation/read-document";

// Optional, secondary step — deliberately separate from /api/process so
// grading can never delay mapping/highlighting, and only runs when the
// teacher actually asks for it. Multipart, not JSON: re-attaching the
// original answer-sheet file lets grading re-examine the actual
// handwriting instead of trusting the transcribed text alone — though the
// file is optional (e.g. after a page refresh only the JSON result
// survives), in which case grading falls back to text-only.
export const runtime = "nodejs";
export const maxDuration = 30;

const payloadSchema = z.object({
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
  const form = await request.formData();
  const rawPayload = form.get("payload");
  const parsedPayload = payloadSchema.safeParse(
    typeof rawPayload === "string" ? JSON.parse(rawPayload) : null
  );
  if (!parsedPayload.success) {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const answerSheet = await readDocument(form, "answerSheet");
  if (answerSheet) {
    const check = validateFileInput(answerSheet);
    if (!check.valid) {
      return Response.json({ error: check.error }, { status: 400 });
    }
  }

  try {
    const { questions, answers, mappings } = parsedPayload.data;
    const evaluations = await evaluateAssessment(
      questions,
      answers,
      mappings,
      geminiAnalyzer,
      answerSheet ?? undefined
    );
    return Response.json({ evaluations });
  } catch (err) {
    console.error("evaluateAssessment failed:", describeAiError(err));
    const message = err instanceof AiOutputError ? "AI grading failed. Please try again." : "Something went wrong while grading.";
    return Response.json({ error: message }, { status: 502 });
  }
}
