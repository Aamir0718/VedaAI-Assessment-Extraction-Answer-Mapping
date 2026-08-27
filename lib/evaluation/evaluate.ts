import type { Answer, AnswerMapping, Evaluation, Question } from "@/types/assessment";
import type { DocumentAnalyzer } from "@/lib/ai/types";

type Evaluator = Pick<DocumentAnalyzer, "evaluate">;

/**
 * Grades every question that has a confidently-mapped answer, in one
 * batched AI call — never per question. Unanswered questions and unmapped
 * answers are skipped (there's nothing to grade); an AI-returned
 * questionId that doesn't match one of the pairs actually sent is dropped
 * rather than trusted, same defensive pattern as the mapping fallback.
 */
export async function evaluateAssessment(
  questions: Question[],
  answers: Answer[],
  mappings: AnswerMapping[],
  analyzer: Evaluator
): Promise<Evaluation[]> {
  const pairs = buildGradablePairs(questions, answers, mappings);
  if (pairs.length === 0) return [];

  const validQuestionIds = new Set(pairs.map((p) => p.question.id));
  const evaluations = await analyzer.evaluate(pairs);
  return evaluations.filter((e) => validQuestionIds.has(e.questionId));
}

function buildGradablePairs(
  questions: Question[],
  answers: Answer[],
  mappings: AnswerMapping[]
): { question: Question; answer: Answer }[] {
  const pairs: { question: Question; answer: Answer }[] = [];
  for (const mapping of mappings) {
    if (!mapping.questionId || mapping.method === "unmapped") continue;
    const question = questions.find((q) => q.id === mapping.questionId);
    const answer = answers.find((a) => a.id === mapping.answerId);
    if (question && answer) pairs.push({ question, answer });
  }
  return pairs;
}
