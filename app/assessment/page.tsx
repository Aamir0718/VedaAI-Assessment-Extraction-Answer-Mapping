"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAssessmentStore } from "@/lib/state/assessment-store";
import { QuestionList } from "@/components/assessment/QuestionList";
import { UnmatchedAnswers } from "@/components/assessment/UnmatchedAnswers";
import { QuestionDetail } from "@/components/assessment/QuestionDetail";
import { AnswerSheetViewer } from "@/components/viewer/AnswerSheetViewer";

type Selection = { kind: "question" | "answer"; id: string };

export default function AssessmentPage() {
  const router = useRouter();
  const { state } = useAssessmentStore();
  const firstQuestionId = state.result?.questions[0]?.id;
  const [selection, setSelection] = useState<Selection | null>(
    firstQuestionId ? { kind: "question", id: firstQuestionId } : null
  );

  if (!state.result) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm text-neutral-500">No assessment results yet.</p>
        <button type="button" onClick={() => router.push("/")} className="text-sm underline">
          Upload documents
        </button>
      </main>
    );
  }

  const { questions, answers, mappings } = state.result;
  const question = selection?.kind === "question" ? questions.find((q) => q.id === selection.id) ?? null : null;
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
    <main className="grid flex-1 grid-cols-[260px_360px_1fr] divide-x">
      <div className="flex flex-col overflow-auto">
        <QuestionList
          questions={questions}
          mappings={mappings}
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
      <QuestionDetail question={question} answer={answer} mapping={mapping} />
      <div className="overflow-auto p-4">
        {state.answerSheet && answer ? (
          <AnswerSheetViewer file={state.answerSheet} regions={answer.regions} />
        ) : (
          <p className="text-sm text-neutral-400">
            {state.answerSheet
              ? "No answer to display for this question."
              : "Answer sheet not available — please re-upload to view highlights."}
          </p>
        )}
      </div>
    </main>
  );
}
