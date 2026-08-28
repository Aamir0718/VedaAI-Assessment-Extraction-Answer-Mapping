import type { Answer, AnswerMapping, Evaluation, Question } from "@/types/assessment";
import type { DocumentAnalyzer } from "@/lib/ai/types";
import type { FileInput } from "@/lib/validation/file-validation";
import { DEFAULT_MAX_MARKS } from "./total-marks";

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
 * `doc`, when available, is the original answer-sheet file(s) — passed
 * through so grading can re-examine the actual handwriting rather than
 * grade blind off a possibly-imperfect transcription.
 */
export async function evaluateAssessment(
  questions: Question[],
  answers: Answer[],
  mappings: AnswerMapping[],
  analyzer: Evaluator,
  doc?: FileInput
): Promise<Evaluation[]> {
  const pairs = buildGradablePairs(questions, answers, mappings);
  if (pairs.length === 0) return [];

  const graded = await gradeValidated(pairs, analyzer, doc);
  const gradedIds = new Set(graded.map((e) => e.questionId));
  const missing = pairs.filter((p) => !gradedIds.has(p.question.id));
  if (missing.length === 0) return graded;

  const retried = await gradeValidated(missing, analyzer, doc);
  return [...graded, ...retried];
}

/**
 * Calls the analyzer for exactly this batch, drops any result that isn't
 * one of the pairs sent, and overrides marks/maxMarks against the
 * question's own authoritative max — never trusts the model's echoed
 * maxMarks (it can disagree with what was printed) or a marks value above
 * it (over-scoring), which would otherwise silently corrupt both the
 * per-question badge and the paper total.
 */
async function gradeValidated(pairs: Pair[], analyzer: Evaluator, doc?: FileInput): Promise<Evaluation[]> {
  const maxMarksById = new Map(pairs.map((p) => [p.question.id, p.question.maxMarks ?? DEFAULT_MAX_MARKS]));
  const evaluations = await analyzer.evaluate(pairs, doc);
  return evaluations
    .filter((e) => maxMarksById.has(e.questionId))
    .map((e) => {
      const maxMarks = maxMarksById.get(e.questionId)!;
      return { ...e, maxMarks, marks: Math.min(Math.max(e.marks, 0), maxMarks) };
    });
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
