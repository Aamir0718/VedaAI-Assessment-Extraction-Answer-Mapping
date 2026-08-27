import type { Answer, Question } from "@/types/assessment";

/** Builds a Question fixture; id is derived from the number for readable assertions. */
export function question(number: string, text = `Question ${number}`): Question {
  return { id: `q-${number}`, number, text };
}

/** Builds an Answer fixture with a sensible default single region. */
export function answer(
  id: string,
  text: string,
  opts: { detectedQuestionNumber?: string; regions?: Answer["regions"] } = {}
): Answer {
  return {
    id,
    text,
    detectedQuestionNumber: opts.detectedQuestionNumber,
    regions: opts.regions ?? [{ page: 1, x: 0, y: 0, width: 0.5, height: 0.1 }],
  };
}
