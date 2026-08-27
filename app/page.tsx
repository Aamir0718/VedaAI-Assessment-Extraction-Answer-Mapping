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
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <BackgroundGlow />
        <AppHeader />
        <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 p-8">
          <ProcessingHero />
          <div className="animate-fade-up w-full rounded-2xl border border-neutral-100 bg-white/90 p-5 shadow-sm backdrop-blur">
            <StageList received={stages} />
          </div>
          {error && <p className="text-center text-sm text-red-600">{error}</p>}
        </main>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-neutral-50">
      <BackgroundGlow />
      <AppHeader />
      <main className="relative mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 p-6">
        <div className="animate-fade-up rounded-2xl border border-neutral-200 bg-white/95 p-6 shadow-sm backdrop-blur sm:p-8">
          <UploadHero />
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <FileDropzone noun="Question Paper" accept={ACCEPT} files={questionPaper} onSelect={setQuestionPaper} />
            <FileDropzone noun="Answer Sheet" accept={ACCEPT} files={answerSheet} onSelect={setAnswerSheet} />
          </div>
        </div>

        {error && <p className="text-center text-sm text-red-600">{error}</p>}

        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            disabled={!isReady}
            onClick={() => isReady && submit(questionPaper, answerSheet)}
            className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-neutral-900 to-neutral-800 px-6 py-2.5 text-sm font-medium text-white transition-all duration-200 enabled:hover:-translate-y-0.5 enabled:hover:shadow-lg enabled:hover:shadow-orange-200 enabled:active:translate-y-0 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
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

/** A soft, decorative gradient wash — purely visual, sits behind everything. */
function BackgroundGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-32 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-orange-100 via-amber-50 to-transparent opacity-70 blur-3xl" />
    </div>
  );
}
