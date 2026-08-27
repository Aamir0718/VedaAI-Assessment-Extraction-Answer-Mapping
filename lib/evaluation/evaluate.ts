import type { Answer, AnswerMapping, Evaluation, Question } from "@/types/assessment";
import type { DocumentAnalyzer } from "@/lib/ai/types";

type Evaluator = Pick<DocumentAnalyzer, "evaluate">;
type Pair = { question: Question; answer: Answer };

/**
 * Grades every question that has a confidently-mapped answer, in one
 * batched AI call — never per question. Unanswered questions and unmapped
 * answers are skipped (there's nothing to grade); an AI-returned
 * questionId that doesn't match one of the pairs actually sent is dropped
 * rather than trusted, same defensive pattern as the mapping fallback.
 * A batched call occasionally omits an item — one bounded retry covers
 * just what's missing, never a full resend of what's already graded.
 */
export async function evaluateAssessment(
  questions: Question[],
  answers: Answer[],
  mappings: AnswerMapping[],
  analyzer: Evaluator
): Promise<Evaluation[]> {
  const pairs = buildGradablePairs(questions, answers, mappings);
  if (pairs.length === 0) return [];

  const graded = await gradeValidated(pairs, analyzer);
  const gradedIds = new Set(graded.map((e) => e.questionId));
  const missing = pairs.filter((p) => !gradedIds.has(p.question.id));
  if (missing.length === 0) return graded;

  const retried = await gradeValidated(missing, analyzer);
  return [...graded, ...retried];
}

/** Calls the analyzer for exactly this batch and drops any result that isn't one of the pairs sent. */
async function gradeValidated(pairs: Pair[], analyzer: Evaluator): Promise<Evaluation[]> {
  const validQuestionIds = new Set(pairs.map((p) => p.question.id));
  const evaluations = await analyzer.evaluate(pairs);
  return evaluations.filter((e) => validQuestionIds.has(e.questionId));
}

function buildGradablePairs(questions: Question[], answers: Answer[], mappings: AnswerMapping[]): Pair[] {
  const pairs: Pair[] = [];
  for (const mapping of mappings) {
    if (!mapping.questionId || mapping.method === "unmapped") continue;
    const question = questions.find((q) => q.id === mapping.questionId);
    const answer = answers.find((a) => a.id === mapping.answerId);
    if (question && answer) pairs.push({ question, answer });
  }
  return pairs;
}
