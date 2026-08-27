import type { Answer, AnswerMapping, Question } from "@/types/assessment";

/** Questions with no successfully mapped answer at all — never fabricated. */
export function getUnansweredQuestions(questions: Question[], mappings: AnswerMapping[]): Question[] {
  const answeredIds = new Set(mappings.filter((m) => m.questionId).map((m) => m.questionId));
  return questions.filter((q) => !answeredIds.has(q.id));
}

/** Answers that couldn't be confidently mapped to any question. */
export function getUnmappedAnswers(answers: Answer[], mappings: AnswerMapping[]): Answer[] {
  const unmappedIds = new Set(
    mappings.filter((m) => m.method === "unmapped").map((m) => m.answerId)
  );
  return answers.filter((a) => unmappedIds.has(a.id));
}
