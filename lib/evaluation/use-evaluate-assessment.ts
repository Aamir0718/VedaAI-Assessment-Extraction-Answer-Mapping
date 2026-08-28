"use client";

import { useState } from "react";
import { useAssessmentStore, type AnswerSheetFile } from "@/lib/state/assessment-store";
import type { Answer, AnswerMapping, Question } from "@/types/assessment";

/** Triggers /api/evaluate on demand — grading never runs unless asked for. */
export function useEvaluateAssessment() {
  const { setEvaluations } = useAssessmentStore();
  const [isGrading, setIsGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function grade(
    questions: Question[],
    answers: Answer[],
    mappings: AnswerMapping[],
    answerSheet: AnswerSheetFile | null
  ) {
    setIsGrading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("payload", JSON.stringify({ questions, answers, mappings }));
      // Re-attach the original answer sheet (still in browser memory as a
      // blob URL from this session) so grading can re-read the actual
      // handwriting instead of trusting the transcription alone.
      if (answerSheet) {
        for (const [index, url] of answerSheet.urls.entries()) {
          const blob = await fetch(url).then((res) => res.blob());
          form.append("answerSheet", blob, `page-${index + 1}`);
        }
      }

      const response = await fetch("/api/evaluate", { method: "POST", body: form });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error ?? "Grading failed.");
      setEvaluations(body.evaluations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Grading failed. Please try again.");
    } finally {
      setIsGrading(false);
    }
  }

  return { grade, isGrading, error };
}
