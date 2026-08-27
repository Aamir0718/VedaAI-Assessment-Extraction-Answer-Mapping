import type { Answer, AnswerMapping, Question } from "@/types/assessment";
import type { DocumentAnalyzer } from "@/lib/ai/types";
import { explicitMatch } from "./explicit-match";
import { positionalFallback } from "./positional-fallback";

type AmbiguousResolver = Pick<DocumentAnalyzer, "resolveAmbiguousMappings">;

/**
 * Maps every answer to a question — or explicitly marks it unmapped —
 * using a strict deterministic-first priority: explicit label, normalized
 * label, then a count-matched positional fallback, then a single batched
 * AI call for whatever remains genuinely ambiguous. Every answer gets
 * exactly one AnswerMapping; nothing is ever silently dropped, and an AI
 * suggestion is only trusted if it names a real candidate question.
 */
export async function mapAnswers(
  questions: Question[],
  answers: Answer[],
  analyzer: AmbiguousResolver
): Promise<AnswerMapping[]> {
  const mappings: AnswerMapping[] = [];
  const claimedQuestionIds = new Set<string>();
  const unresolved: Answer[] = [];

  for (const answer of answers) {
    const match = explicitMatch(answer, questions);
    if (match) {
      mappings.push(match);
      claimedQuestionIds.add(match.questionId as string);
    } else {
      unresolved.push(answer);
    }
  }

  const remainingQuestions = questions.filter((q) => !claimedQuestionIds.has(q.id));
  const positional = positionalFallback(unresolved, remainingQuestions);
  const positionalAnswerIds = new Set(positional.map((m) => m.answerId));
  mappings.push(...positional);
  for (const m of positional) claimedQuestionIds.add(m.questionId as string);

  const ambiguous = unresolved.filter((a) => !positionalAnswerIds.has(a.id));
  if (ambiguous.length > 0) {
    const candidates = questions.filter((q) => !claimedQuestionIds.has(q.id));
    mappings.push(...(await resolveViaAi(ambiguous, candidates, analyzer)));
  }

  return mappings;
}

async function resolveViaAi(
  ambiguous: Answer[],
  candidates: Question[],
  analyzer: AmbiguousResolver
): Promise<AnswerMapping[]> {
  const candidateIds = new Set(candidates.map((q) => q.id));
  const resolved = await analyzer.resolveAmbiguousMappings(ambiguous, candidates);
  const byAnswerId = new Map(resolved.map((r) => [r.answerId, r]));

  return ambiguous.map((answer) => {
    const result = byAnswerId.get(answer.id);
    const questionId =
      result?.questionId && candidateIds.has(result.questionId) ? result.questionId : undefined;

    return questionId
      ? { answerId: answer.id, questionId, confidence: result!.confidence, method: "semantic" as const }
      : { answerId: answer.id, confidence: 0, method: "unmapped" as const };
  });
}
