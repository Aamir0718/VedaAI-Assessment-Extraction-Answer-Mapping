"use client";

import { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { useAssessmentStore } from "@/lib/state/assessment-store";
import { resolveSelection, type Selection } from "@/lib/assessment/resolve-selection";
import { QuestionAccordion } from "@/components/assessment/QuestionAccordion";
import { UnmatchedAnswers } from "@/components/assessment/UnmatchedAnswers";
import { AnswerSheetViewer } from "@/components/viewer/AnswerSheetViewer";
import { ViewerEmptyState } from "@/components/viewer/ViewerEmptyState";
import { ResultsTabs } from "@/components/assessment/ResultsTabs";
import { GradeButton } from "@/components/assessment/GradeButton";
import { TotalMarksBadge } from "@/components/assessment/TotalMarksBadge";
import { EmptyResultsState } from "@/components/assessment/EmptyResultsState";
import { NoResultsState } from "@/components/assessment/NoResultsState";

export default function AssessmentPage() {
  const { state } = useAssessmentStore();
  const firstQuestionId = state.result?.questions[0]?.id;
  const [selection, setSelection] = useState<Selection>(
    firstQuestionId ? { kind: "question", id: firstQuestionId } : null
  );
  const [mobileTab, setMobileTab] = useState<"questions" | "sheet">("questions");

  if (!state.result) {
    return (
      <div className="flex flex-1 flex-col">
        <AppHeader />
        <NoResultsState />
      </div>
    );
  }

  const { questions, answers, mappings, evaluations = [], paperTotalMarks } = state.result;
  if (questions.length === 0) {
    return (
      <div className="flex flex-1 flex-col">
        <AppHeader />
        <EmptyResultsState />
      </div>
    );
  }

  const { answer } = resolveSelection(selection, mappings, answers);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader />
      <ResultsTabs active={mobileTab} onChange={setMobileTab} />
      <main className="animate-fade-up grid flex-1 min-h-0 md:grid-cols-[420px_1fr] md:divide-x md:divide-border-subtle">
        <div className={`overflow-auto p-4 ${mobileTab === "sheet" ? "hidden md:block" : ""}`}>
          <div className="mb-3 flex items-center justify-between">
            <p className="px-1 text-xs font-semibold uppercase tracking-wide text-ink-400">
              Extracted questions ({questions.length})
            </p>
            <GradeButton
              questions={questions}
              answers={answers}
              mappings={mappings}
              answerSheet={state.answerSheet}
              graded={evaluations.length > 0}
            />
          </div>
          <TotalMarksBadge questions={questions} evaluations={evaluations} paperTotalMarks={paperTotalMarks} />
          {answers.length === 0 && (
            <p className="mb-3 rounded-control bg-warning-100 px-3 py-2 text-xs text-warning-600">
              No answers were detected on the uploaded answer sheet — every question is shown as unanswered.
            </p>
          )}
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
        <div className={`overflow-auto bg-surface-muted p-4 ${mobileTab === "questions" ? "hidden md:block" : ""}`}>
          {state.answerSheet && answer ? (
            <AnswerSheetViewer file={state.answerSheet} regions={answer.regions} />
          ) : (
            <ViewerEmptyState
              message={
                state.answerSheet
                  ? "No answer to display for this question."
                  : "Answer sheet not available — please re-upload to view highlights."
              }
            />
          )}
        </div>
      </main>
    </div>
  );
}
