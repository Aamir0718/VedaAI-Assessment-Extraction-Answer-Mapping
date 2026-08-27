import type { Answer, AnswerMapping } from "@/types/assessment";

export type Selection = { kind: "question" | "answer"; id: string } | null;

/**
 * Resolves the currently active mapping + answer from either a selected
 * question or a selected unmatched answer — the one piece of derivation
 * logic the results page needs, pulled out so it's unit-testable without
 * React.
 */
export function resolveSelection(
  selection: Selection,
  mappings: AnswerMapping[],
  answers: Answer[]
): { mapping: AnswerMapping | null; answer: Answer | null } {
  const mapping =
    selection?.kind === "question"
      ? (mappings.find((m) => m.questionId === selection.id) ?? null)
      : selection
        ? (mappings.find((m) => m.answerId === selection.id) ?? null)
        : null;

  const answer =
    selection?.kind === "answer"
      ? (answers.find((a) => a.id === selection.id) ?? null)
      : (answers.find((a) => a.id === mapping?.answerId) ?? null);

  return { mapping, answer };
}
