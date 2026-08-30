import { ChevronDown } from "lucide-react";
import type { Answer, AnswerMapping, Evaluation, Question } from "@/types/assessment";
import { StatusPill } from "./StatusPill";

type Props = {
  question: Question;
  answer: Answer | null;
  mapping: AnswerMapping | null;
  evaluation: Evaluation | null;
  skippedByChoice?: boolean;
  expanded: boolean;
  onToggle: () => void;
};

export function QuestionCard({
  question,
  answer,
  mapping,
  evaluation,
  skippedByChoice,
  expanded,
  onToggle,
}: Props) {
  return (
    <div
      className={`rounded-card border bg-surface transition-all duration-200 ${
        expanded ? "border-brand-300 shadow-md" : "border-border hover:border-brand-300 hover:shadow-sm"
      }`}
    >
      <button type="button" onClick={onToggle} className="flex w-full items-start gap-3 px-3 py-3 text-left">
        <span
          className={`mt-0.5 flex min-w-6 shrink-0 items-center justify-center rounded-pill px-1.5 py-0.5 text-xs font-semibold transition-colors ${
            expanded ? "bg-gradient-to-br from-brand-500 to-brand-600 text-white" : "bg-ink-100 text-ink-700"
          }`}
        >
          {question.number}
        </span>
        <span className={`flex-1 text-sm text-ink-800 ${expanded ? "" : "line-clamp-2"}`}>{question.text}</span>
        <StatusPill evaluation={evaluation} mapping={mapping} skippedByChoice={skippedByChoice} />
        <ChevronDown
          className={`mt-0.5 size-4 shrink-0 text-ink-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      <div className={`grid transition-all duration-300 ease-in-out ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="space-y-3 border-t border-border-subtle px-3 pb-3 pt-3">
            <div>
              <p className="text-xs font-medium text-ink-400">Answer</p>
              {answer ? (
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink-700">{answer.text}</p>
              ) : skippedByChoice ? (
                <p className="mt-1 text-sm text-ink-400">
                  Not needed — this question offers a choice, and the alternative was answered instead.
                </p>
              ) : (
                <p className="mt-1 text-sm text-ink-400">Not answered.</p>
              )}
            </div>
            {mapping && mapping.method !== "unmapped" && mapping.confidence < 0.7 && (
              <p className="text-xs text-warning-600">⚠ Low-confidence match — please verify against the answer sheet.</p>
            )}
            {evaluation && (
              <div className="rounded-control bg-brand-50 p-3">
                <p className="text-xs font-semibold text-brand-600">AI Feedback</p>
                <p className="mt-1 text-sm text-ink-800">{evaluation.feedback}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
