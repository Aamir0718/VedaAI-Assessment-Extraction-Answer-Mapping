import type { NextRequest } from "next/server";
import { validateFile, type FileInput } from "@/lib/validation/file-validation";
import { processAssessment } from "@/lib/processing/process-assessment";

// Needs Buffer/pdfjs-dist — not Edge-compatible. Generous duration since a
// single request covers the whole pipeline (one document analysis pass).
export const runtime = "nodejs";
export const maxDuration = 60;

async function readField(form: FormData, field: string): Promise<FileInput | null> {
  const file = form.get(field);
  if (!(file instanceof File)) return null;
  return { buffer: Buffer.from(await file.arrayBuffer()), mimeType: file.type, name: file.name };
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const questionPaper = await readField(form, "questionPaper");
  const answerSheet = await readField(form, "answerSheet");

  if (!questionPaper || !answerSheet) {
    return Response.json(
      { error: "Both a question paper and an answer sheet are required." },
      { status: 400 }
    );
  }

  for (const file of [questionPaper, answerSheet]) {
    const result = validateFile(file);
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
