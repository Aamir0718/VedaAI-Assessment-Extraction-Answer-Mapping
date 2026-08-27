import type { AnswerMapping, Question } from "@/types/assessment";

type Props = {
  questions: Question[];
  mappings: AnswerMapping[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

function statusIcon(question: Question, mappings: AnswerMapping[]): string {
  const mapping = mappings.find((m) => m.questionId === question.id);
  if (!mapping) return "○"; // unanswered
  return mapping.confidence < 0.7 ? "⚠" : "✓";
}

export function QuestionList({ questions, mappings, selectedId, onSelect }: Props) {
  return (
    <ul className="overflow-auto p-2">
      {questions.map((q) => (
        <li key={q.id}>
          <button
            type="button"
            onClick={() => onSelect(q.id)}
            className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm ${
              q.id === selectedId ? "bg-neutral-100 font-medium" : "hover:bg-neutral-50"
            }`}
          >
            <span aria-hidden>{statusIcon(q, mappings)}</span>
            <span className="truncate">{q.number}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
