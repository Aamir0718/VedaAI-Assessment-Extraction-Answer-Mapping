"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAssessmentStore } from "@/lib/state/assessment-store";
import { readNdjsonStream } from "./read-ndjson-stream";
import type { ProcessEvent, StageId } from "./stages";

/** Drives the upload -> stream -> navigate flow; keeps app/page.tsx thin. */
export function useProcessAssessment() {
  const router = useRouter();
  const { setResult } = useAssessmentStore();
  const [stages, setStages] = useState<{ id: StageId; label: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  async function submit(questionPaper: File, answerSheet: File) {
    setError(null);
    setStages([]);
    setIsProcessing(true);

    const form = new FormData();
    form.append("questionPaper", questionPaper);
    form.append("answerSheet", answerSheet);

    try {
      const response = await fetch("/api/process", { method: "POST", body: form });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Upload failed. Please try again.");
      }

      for await (const event of readNdjsonStream<ProcessEvent>(response)) {
        if (event.type === "stage") {
          setStages((prev) => [...prev, { id: event.id, label: event.label }]);
        } else if (event.type === "error") {
          setError(event.message);
          setIsProcessing(false);
          return;
        } else if (event.type === "result") {
          setResult(event.result, { url: URL.createObjectURL(answerSheet), mimeType: answerSheet.type });
          setIsProcessing(false);
          router.push("/assessment");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      setIsProcessing(false);
    }
  }

  return { submit, stages, error, isProcessing };
}
