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
    <div className="border-t p-2">
      <p className="px-2 pb-1 text-xs font-medium text-neutral-400">Unmatched answers</p>
      <ul>
        {unmatched.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => onSelect(a.id)}
              className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm ${
                a.id === selectedAnswerId ? "bg-neutral-100 font-medium" : "hover:bg-neutral-50"
              }`}
            >
              <span aria-hidden>✕</span>
              <span className="truncate">{a.text.slice(0, 30)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
