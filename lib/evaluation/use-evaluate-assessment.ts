"use client";

import { useState } from "react";
import { useAssessmentStore } from "@/lib/state/assessment-store";
import type { Answer, AnswerMapping, Question } from "@/types/assessment";

/** Triggers /api/evaluate on demand — grading never runs unless asked for. */
export function useEvaluateAssessment() {
  const { setEvaluations } = useAssessmentStore();
  const [isGrading, setIsGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function grade(questions: Question[], answers: Answer[], mappings: AnswerMapping[]) {
    setIsGrading(true);
    setError(null);
    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions, answers, mappings }),
      });
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
