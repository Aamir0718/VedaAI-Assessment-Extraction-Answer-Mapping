import { ChevronDown } from "lucide-react";
import type { Answer, AnswerMapping, Evaluation, Question } from "@/types/assessment";
import { StatusPill } from "./StatusPill";

type Props = {
  question: Question;
  answer: Answer | null;
  mapping: AnswerMapping | null;
  evaluation: Evaluation | null;
  expanded: boolean;
  onToggle: () => void;
};

export function QuestionCard({ question, answer, mapping, evaluation, expanded, onToggle }: Props) {
  return (
    <div
      className={`rounded-xl border bg-white transition ${expanded ? "border-orange-300 shadow-sm" : "border-neutral-200"}`}
    >
      <button type="button" onClick={onToggle} className="flex w-full items-start gap-3 px-3 py-3 text-left">
        <span className="mt-0.5 flex min-w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 px-1.5 py-0.5 text-xs font-semibold text-neutral-600">
          {question.number}
        </span>
        <span className={`flex-1 text-sm text-neutral-800 ${expanded ? "" : "line-clamp-2"}`}>{question.text}</span>
        <StatusPill evaluation={evaluation} mapping={mapping} />
        <ChevronDown
          className={`mt-0.5 size-4 shrink-0 text-neutral-400 transition ${expanded ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {expanded && (
        <div className="space-y-3 border-t border-neutral-100 px-3 pb-3 pt-3">
          <div>
            <p className="text-xs font-medium text-neutral-400">Answer</p>
            {answer ? (
              <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">{answer.text}</p>
            ) : (
              <p className="mt-1 text-sm text-neutral-400">Not answered.</p>
            )}
          </div>
          {mapping && mapping.method !== "unmapped" && mapping.confidence < 0.7 && (
            <p className="text-xs text-amber-600">⚠ Low-confidence match — please verify against the answer sheet.</p>
          )}
          {evaluation && (
            <div className="rounded-lg bg-orange-50 p-3">
              <p className="text-xs font-semibold text-orange-700">AI Feedback</p>
              <p className="mt-1 text-sm text-orange-900">{evaluation.feedback}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
