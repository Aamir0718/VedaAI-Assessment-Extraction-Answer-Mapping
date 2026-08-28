"use client";

import { Sparkles } from "lucide-react";
import type { Answer, AnswerMapping, Question } from "@/types/assessment";
import { useEvaluateAssessment } from "@/lib/evaluation/use-evaluate-assessment";
import type { AnswerSheetFile } from "@/lib/state/assessment-store";

type Props = {
  questions: Question[];
  answers: Answer[];
  mappings: AnswerMapping[];
  answerSheet: AnswerSheetFile | null;
  graded: boolean;
};

/** Optional, on-demand grading — never runs automatically, never blocks the core flow. */
export function GradeButton({ questions, answers, mappings, answerSheet, graded }: Props) {
  const { grade, isGrading, error } = useEvaluateAssessment();

  if (graded) {
    return (
      <p className="animate-fade-up flex items-center gap-1 px-1 text-xs font-medium text-emerald-600">
        <Sparkles className="size-3.5" aria-hidden /> Graded with AI
      </p>
    );
  }

  return (
    <div className="px-1">
      <button
        type="button"
        onClick={() => grade(questions, answers, mappings, answerSheet)}
        disabled={isGrading}
        className="flex items-center gap-1.5 rounded-full border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 px-3 py-1.5 text-xs font-medium text-orange-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-sm active:translate-y-0 active:scale-95 disabled:cursor-wait disabled:opacity-70"
      >
        <Sparkles className={`size-3.5 ${isGrading ? "animate-spin-slow" : ""}`} aria-hidden />
        {isGrading ? "Grading…" : "Grade with AI"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
