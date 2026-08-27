import type { Answer, AnswerMapping, Question } from "@/types/assessment";

type Props = { question: Question | null; answer: Answer | null; mapping: AnswerMapping | null };

export function QuestionDetail({ question, answer, mapping }: Props) {
  if (!question && !answer) {
    return <p className="p-4 text-sm text-neutral-400">Select a question to see its answer.</p>;
  }

  return (
    <div className="flex flex-col gap-4 overflow-auto p-4">
      <div>
        <p className="text-xs font-medium text-neutral-400">
          {question ? `Question ${question.number}` : "Unmatched answer"}
        </p>
        {question ? (
          <p className="mt-1 text-sm">{question.text}</p>
        ) : (
          <p className="mt-1 text-sm text-neutral-400">Could not be confidently matched to any question.</p>
        )}
      </div>
      <div>
        <p className="text-xs font-medium text-neutral-400">Answer</p>
        {answer ? (
          <>
            <p className="mt-1 whitespace-pre-wrap text-sm">{answer.text}</p>
            {mapping && mapping.method !== "unmapped" && mapping.confidence < 0.7 && (
              <p className="mt-2 text-xs text-amber-600">⚠ Needs review — low-confidence match.</p>
            )}
          </>
        ) : (
          <p className="mt-1 text-sm text-neutral-400">Not answered.</p>
        )}
      </div>
    </div>
  );
}
