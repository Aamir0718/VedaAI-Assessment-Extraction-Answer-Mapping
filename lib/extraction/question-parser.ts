import type { Question } from "@/types/assessment";
import {
  QUESTION_PREFIX,
  SUBPART_DOT_PATTERN,
  SUBPART_PATTERN,
  TOP_LEVEL_PATTERN,
} from "./question-patterns";

type LabelMatch = { number: string; rest: string };

/** Tries each numbering pattern against one line, most specific first. */
function matchLabel(line: string): LabelMatch | null {
  const stripped = line.replace(QUESTION_PREFIX, "");

  const subpart = stripped.match(SUBPART_PATTERN);
  if (subpart) {
    const [full, num, part] = subpart;
    return { number: `${num}(${part})`, rest: stripped.slice(full.length) };
  }

  const subpartDot = stripped.match(SUBPART_DOT_PATTERN);
  if (subpartDot) {
    const [full, num, part] = subpartDot;
    return { number: `${num}(${part})`, rest: stripped.slice(full.length) };
  }

  const topLevel = stripped.match(TOP_LEVEL_PATTERN);
  if (topLevel) {
    const [full, num] = topLevel;
    return { number: num, rest: stripped.slice(full.length) };
  }

  return null;
}

/**
 * Deterministically parses printed question-paper text into Question[],
 * preserving original order and numbering. Labelled sub-parts (e.g.
 * "11(a)", "11(b)") become independent questions rather than being merged
 * under "11". Lines before the first recognized label are ignored (title/
 * instructions); a line that doesn't start a new label is appended to the
 * text of whichever question is currently open.
 */
export function parseQuestions(rawText: string): Question[] {
  const lines = rawText.split(/\r?\n/);
  const questions: Question[] = [];
  let current: Question | null = null;

  for (const line of lines) {
    if (!line.trim()) continue;

    const label = matchLabel(line);
    if (label) {
      current = {
        id: `q-${questions.length + 1}`,
        number: label.number,
        text: label.rest.trim(),
      };
      questions.push(current);
    } else if (current) {
      current.text = `${current.text} ${line.trim()}`.trim();
    }
  }

  return questions;
}
