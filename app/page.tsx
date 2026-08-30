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
  const [questionPaper, setQuestionPaper] = useState<File[]>([]);
  const [answerSheet, setAnswerSheet] = useState<File[]>([]);
  const { submit, stages, error, isProcessing } = useProcessAssessment();
  const isReady = questionPaper.length > 0 && answerSheet.length > 0;

  if (isProcessing || stages.length > 0) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden bg-bg">
        <AppHeader />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 p-8">
          <ProcessingHero />
          <div className="animate-fade-up w-full rounded-panel border border-border-subtle bg-surface p-5 shadow-sm">
            <StageList received={stages} />
          </div>
          {error && <p className="text-center text-sm text-danger-600">{error}</p>}
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bg">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 p-6">
        <div className="animate-fade-up rounded-card border border-border bg-surface p-6 shadow-sm sm:p-8">
          <UploadHero />
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <FileDropzone noun="Question Paper" accept={ACCEPT} files={questionPaper} onSelect={setQuestionPaper} />
            <FileDropzone noun="Answer Sheet" accept={ACCEPT} files={answerSheet} onSelect={setAnswerSheet} />
          </div>
        </div>

        {error && <p className="text-center text-sm text-danger-600">{error}</p>}

        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            disabled={!isReady}
            onClick={() => isReady && submit(questionPaper, answerSheet)}
            className="group flex items-center gap-2 rounded-pill px-6 py-2.5 text-sm font-medium transition-all duration-200 enabled:bg-gradient-to-r enabled:from-ink-900 enabled:to-ink-800 enabled:text-white enabled:hover:-translate-y-0.5 enabled:hover:shadow-lg enabled:hover:shadow-brand-100 enabled:active:translate-y-0 enabled:active:scale-95 disabled:cursor-not-allowed disabled:bg-ink-100 disabled:text-ink-400"
          >
            Process Assessment
            <ArrowRight className="size-4 transition group-enabled:group-hover:translate-x-0.5" aria-hidden />
          </button>
          <p className="text-xs text-ink-400">
            {isReady ? "Ready to extract questions and map answers." : "Upload both files to continue."}
          </p>
        </div>
      </main>
    </div>
  );
}
