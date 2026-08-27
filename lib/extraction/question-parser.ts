import type { Question } from "@/types/assessment";
import {
  MODULE_HEADING_PATTERN,
  OR_LINE_PATTERN,
  QUESTION_PREFIX,
  SUBPART_DOT_PATTERN,
  SUBPART_PATTERN,
  SUBPART_SPACE_PATTERN,
  TOP_LEVEL_PATTERN,
} from "./question-patterns";
import { extractMaxMarks } from "./question-marks";
import { applyChoiceGroups } from "./choice-groups";

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

  const subpartSpace = stripped.match(SUBPART_SPACE_PATTERN);
  if (subpartSpace) {
    const [full, num, part] = subpartSpace;
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
 * text of whichever question is currently open — except a "Module - N"
 * section heading, which is dropped entirely rather than glued onto
 * whatever question happened to precede it. A standalone "OR" line
 * marks the question(s) that follow it as an alternative to whatever
 * came before — see `choice-groups.ts` for how that's resolved into
 * shared `choiceGroup` ids, since a real paper's "OR" usually separates
 * two entire multi-part questions, not just two single ones.
 */
export function parseQuestions(rawText: string): Question[] {
  const lines = rawText.split(/\r?\n/);
  const questions: Question[] = [];
  const afterOr: boolean[] = [];
  let current: Question | null = null;
  let orPending = false;

  for (const line of lines) {
    if (!line.trim() || MODULE_HEADING_PATTERN.test(line)) continue;

    if (OR_LINE_PATTERN.test(line) && current) {
      orPending = true;
      continue;
    }

    const label = matchLabel(line);
    if (label) {
      current = {
        id: `q-${questions.length + 1}`,
        number: label.number,
        text: label.rest.trim(),
      };
      questions.push(current);
      afterOr.push(orPending);
      orPending = false;
    } else if (current) {
      current.text = `${current.text} ${line.trim()}`.trim();
    }
  }

  // A question's marks annotation (e.g. "[5]") only appears once the full
  // text — including any continuation lines — has been assembled, so this
  // is a separate pass rather than done inline above.
  return applyChoiceGroups(questions, afterOr).map((q) => {
    const { text, maxMarks } = extractMaxMarks(q.text);
    return maxMarks === undefined ? q : { ...q, text, maxMarks };
  });
}
