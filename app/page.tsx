"use client";

import { useState } from "react";
import { FileDropzone } from "@/components/upload/FileDropzone";
import { StageList } from "@/components/processing/StageList";
import { useProcessAssessment } from "@/lib/processing/use-process-assessment";
import { ALLOWED_MIME_TYPES } from "@/lib/validation/file-validation";

const ACCEPT = ALLOWED_MIME_TYPES.join(",");

export default function UploadPage() {
  const [questionPaper, setQuestionPaper] = useState<File | null>(null);
  const [answerSheet, setAnswerSheet] = useState<File | null>(null);
  const { submit, stages, error, isProcessing } = useProcessAssessment();

  if (isProcessing || stages.length > 0) {
    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 p-8">
        <h1 className="text-lg font-semibold">Processing assessment…</h1>
        <StageList received={stages} />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-xl flex-1 flex-col justify-center gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">VedaAI Assessment Extraction &amp; Answer Mapping</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Upload a question paper and a handwritten answer sheet to get started.
        </p>
      </div>
      <FileDropzone label="Question paper" accept={ACCEPT} file={questionPaper} onSelect={setQuestionPaper} />
      <FileDropzone label="Answer sheet" accept={ACCEPT} file={answerSheet} onSelect={setAnswerSheet} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        disabled={!questionPaper || !answerSheet}
        onClick={() => questionPaper && answerSheet && submit(questionPaper, answerSheet)}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
      >
        Process Assessment
      </button>
    </main>
  );
}
