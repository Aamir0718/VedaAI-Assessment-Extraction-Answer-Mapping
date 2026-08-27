import type { Answer, AnswerMapping, Evaluation, Question } from "@/types/assessment";
import { QuestionCard } from "./QuestionCard";

type Props = {
  questions: Question[];
  answers: Answer[];
  mappings: AnswerMapping[];
  evaluations: Evaluation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

/** True when this question's OR-choice partner was answered instead — skipping it was expected. */
function isSkippedByChoice(question: Question, questions: Question[], mappings: AnswerMapping[]): boolean {
  if (!question.choiceGroup) return false;
  return questions.some(
    (q) =>
      q.id !== question.id &&
      q.choiceGroup === question.choiceGroup &&
      mappings.some((m) => m.questionId === q.id)
  );
}

/** One card per question; clicking a card both expands it and drives the viewer's highlight. */
export function QuestionAccordion({ questions, answers, mappings, evaluations, selectedId, onSelect }: Props) {
  return (
    <div className="space-y-2">
      {questions.map((question) => {
        const mapping = mappings.find((m) => m.questionId === question.id) ?? null;
        const answer = answers.find((a) => a.id === mapping?.answerId) ?? null;
        const evaluation = evaluations.find((e) => e.questionId === question.id) ?? null;
        return (
          <QuestionCard
            key={question.id}
            question={question}
            answer={answer}
            mapping={mapping}
            evaluation={evaluation}
            skippedByChoice={!mapping && isSkippedByChoice(question, questions, mappings)}
            expanded={selectedId === question.id}
            onToggle={() => onSelect(question.id)}
          />
        );
      })}
    </div>
  );
}
