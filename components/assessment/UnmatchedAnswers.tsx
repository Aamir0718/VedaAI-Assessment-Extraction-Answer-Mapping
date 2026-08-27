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
      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
        Unmatched answers ({unmatched.length})
      </p>
      <div className="space-y-2">
        {unmatched.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onSelect(a.id)}
            className={`flex w-full items-start gap-2 rounded-xl border bg-white px-3 py-2.5 text-left text-sm transition ${
              a.id === selectedAnswerId ? "border-orange-300 shadow-sm" : "border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
              <X className="size-3" aria-hidden />
            </span>
            <span className="line-clamp-2 flex-1 text-neutral-700">{a.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
