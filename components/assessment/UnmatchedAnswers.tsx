import { X } from "lucide-react";
import type { Answer, AnswerMapping } from "@/types/assessment";

type Props = {
  answers: Answer[];
  mappings: AnswerMapping[];
  selectedAnswerId: string | null;
  onSelect: (id: string) => void;
};

/** Answers that couldn't be confidently mapped — never hidden from the teacher. */
export function UnmatchedAnswers({ answers, mappings, selectedAnswerId, onSelect }: Props) {
  const unmatchedIds = new Set(mappings.filter((m) => m.method === "unmapped").map((m) => m.answerId));
  const unmatched = answers.filter((a) => unmatchedIds.has(a.id));
  if (unmatched.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-ink-400">
        Unmatched answers ({unmatched.length})
      </p>
      <div className="space-y-2">
        {unmatched.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onSelect(a.id)}
            className={`flex w-full items-start gap-2 rounded-card border bg-surface px-3 py-2.5 text-left text-sm transition-all duration-200 ${
              a.id === selectedAnswerId
                ? "border-brand-300 shadow-md"
                : "border-red-200 hover:-translate-y-0.5 hover:border-red-300 hover:shadow-sm"
            }`}
          >
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-pill bg-danger-100 text-danger-500">
              <X className="size-3" aria-hidden />
            </span>
            <span className="line-clamp-2 flex-1 text-ink-700">{a.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
