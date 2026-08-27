"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileQuestion } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { useAssessmentStore } from "@/lib/state/assessment-store";
import { QuestionAccordion } from "@/components/assessment/QuestionAccordion";
import { UnmatchedAnswers } from "@/components/assessment/UnmatchedAnswers";
import { AnswerSheetViewer } from "@/components/viewer/AnswerSheetViewer";
import { ResultsTabs } from "@/components/assessment/ResultsTabs";
import { GradeButton } from "@/components/assessment/GradeButton";

type Selection = { kind: "question" | "answer"; id: string };

export default function AssessmentPage() {
  const router = useRouter();
  const { state } = useAssessmentStore();
  const firstQuestionId = state.result?.questions[0]?.id;
  const [selection, setSelection] = useState<Selection | null>(
    firstQuestionId ? { kind: "question", id: firstQuestionId } : null
  );
  const [mobileTab, setMobileTab] = useState<"questions" | "sheet">("questions");

  if (!state.result) {
    return (
      <div className="flex flex-1 flex-col">
        <AppHeader />
        <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <FileQuestion className="size-10 text-neutral-300" aria-hidden />
          <p className="text-sm text-neutral-500">No assessment results yet.</p>
          <button type="button" onClick={() => router.push("/")} className="text-sm font-medium text-orange-600 underline">
            Upload documents
          </button>
        </main>
      </div>
    );
  }

  const { questions, answers, mappings, evaluations = [] } = state.result;
  const mapping =
    selection?.kind === "question"
      ? mappings.find((m) => m.questionId === selection.id) ?? null
      : selection
        ? mappings.find((m) => m.answerId === selection.id) ?? null
        : null;
  const answer =
    selection?.kind === "answer"
      ? answers.find((a) => a.id === selection.id) ?? null
      : answers.find((a) => a.id === mapping?.answerId) ?? null;

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader />
      <ResultsTabs active={mobileTab} onChange={setMobileTab} />
      <main className="grid flex-1 md:grid-cols-[420px_1fr] md:divide-x">
        <div className={`overflow-auto p-4 ${mobileTab === "sheet" ? "hidden md:block" : ""}`}>
          <div className="mb-3 flex items-center justify-between">
            <p className="px-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Extracted questions ({questions.length})
            </p>
            <GradeButton questions={questions} answers={answers} mappings={mappings} graded={evaluations.length > 0} />
          </div>
          <QuestionAccordion
            questions={questions}
            answers={answers}
            mappings={mappings}
            evaluations={evaluations}
            selectedId={selection?.kind === "question" ? selection.id : null}
            onSelect={(id) => setSelection({ kind: "question", id })}
          />
          <UnmatchedAnswers
            answers={answers}
            mappings={mappings}
            selectedAnswerId={selection?.kind === "answer" ? selection.id : null}
            onSelect={(id) => setSelection({ kind: "answer", id })}
          />
        </div>
        <div className={`overflow-auto bg-neutral-50 p-4 ${mobileTab === "questions" ? "hidden md:block" : ""}`}>
          {state.answerSheet && answer ? (
            <AnswerSheetViewer file={state.answerSheet} regions={answer.regions} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <FileQuestion className="size-8 text-neutral-300" aria-hidden />
              <p className="max-w-xs text-sm text-neutral-400">
                {state.answerSheet
                  ? "No answer to display for this question."
                  : "Answer sheet not available — please re-upload to view highlights."}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
