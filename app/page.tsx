"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { FileDropzone } from "@/components/upload/FileDropzone";
import { UploadHero } from "@/components/upload/UploadHero";
import { ProcessingHero } from "@/components/processing/ProcessingHero";
import { StageList } from "@/components/processing/StageList";
import { useProcessAssessment } from "@/lib/processing/use-process-assessment";
import { ALLOWED_MIME_TYPES } from "@/lib/validation/file-validation";

const ACCEPT = ALLOWED_MIME_TYPES.join(",");

export default function UploadPage() {
  const [questionPaper, setQuestionPaper] = useState<File | null>(null);
  const [answerSheet, setAnswerSheet] = useState<File | null>(null);
  const { submit, stages, error, isProcessing } = useProcessAssessment();
  const isReady = questionPaper && answerSheet;

  if (isProcessing || stages.length > 0) {
    return (
      <div className="flex flex-1 flex-col">
        <AppHeader />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 p-8">
          <ProcessingHero />
          <div className="w-full rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
            <StageList received={stages} />
          </div>
          {error && <p className="text-center text-sm text-red-600">{error}</p>}
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-neutral-50">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 p-6">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          <UploadHero />
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <FileDropzone noun="Question Paper" accept={ACCEPT} file={questionPaper} onSelect={setQuestionPaper} />
            <FileDropzone noun="Answer Sheet" accept={ACCEPT} file={answerSheet} onSelect={setAnswerSheet} />
          </div>
        </div>

        {error && <p className="text-center text-sm text-red-600">{error}</p>}

        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            disabled={!isReady}
            onClick={() => questionPaper && answerSheet && submit(questionPaper, answerSheet)}
            className="group flex items-center gap-2 rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white transition enabled:hover:bg-neutral-700 enabled:hover:shadow-md disabled:cursor-not-allowed disabled:opacity-30"
          >
            Process Assessment
            <ArrowRight className="size-4 transition group-enabled:group-hover:translate-x-0.5" aria-hidden />
          </button>
          <p className="text-xs text-neutral-400">
            {isReady ? "Ready to extract questions and map answers." : "Upload both files to continue."}
          </p>
        </div>
      </main>
    </div>
  );
}
