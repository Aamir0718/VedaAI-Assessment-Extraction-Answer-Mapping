import type { NextRequest } from "next/server";
import { validateFileInput } from "@/lib/validation/file-validation";
import { readDocument } from "@/lib/validation/read-document";
import { processAssessment } from "@/lib/processing/process-assessment";

// Needs Buffer/pdfjs-dist — not Edge-compatible. Generous duration since a
// single request covers the whole pipeline (one document analysis pass).
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const questionPaper = await readDocument(form, "questionPaper");
  const answerSheet = await readDocument(form, "answerSheet");

  if (!questionPaper || !answerSheet) {
    return Response.json(
      { error: "Both a question paper and an answer sheet are required." },
      { status: 400 }
    );
  }

  for (const doc of [questionPaper, answerSheet]) {
    const result = validateFileInput(doc);
    if (!result.valid) {
      return Response.json({ error: result.error }, { status: 400 });
    }
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      for await (const event of processAssessment({ questionPaper, answerSheet })) {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" },
  });
}
