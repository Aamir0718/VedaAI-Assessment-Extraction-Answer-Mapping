"use client";

import { Sparkles } from "lucide-react";
import type { Answer, AnswerMapping, Question } from "@/types/assessment";
import { useEvaluateAssessment } from "@/lib/evaluation/use-evaluate-assessment";

type Props = { questions: Question[]; answers: Answer[]; mappings: AnswerMapping[]; graded: boolean };

/** Optional, on-demand grading — never runs automatically, never blocks the core flow. */
export function GradeButton({ questions, answers, mappings, graded }: Props) {
  const { grade, isGrading, error } = useEvaluateAssessment();

  if (graded) {
    return <p className="px-1 text-xs font-medium text-emerald-600">✓ Graded with AI</p>;
  }

  return (
    <div className="px-1">
      <button
        type="button"
        onClick={() => grade(questions, answers, mappings)}
        disabled={isGrading}
        className="flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 transition hover:bg-orange-100 disabled:opacity-50"
      >
        <Sparkles className={`size-3.5 ${isGrading ? "animate-pulse" : ""}`} aria-hidden />
        {isGrading ? "Grading…" : "Grade with AI"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
