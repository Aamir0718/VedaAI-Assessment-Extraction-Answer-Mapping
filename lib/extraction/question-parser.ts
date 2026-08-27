import type { Question } from "@/types/assessment";
import {
  OR_LINE_PATTERN,
  QUESTION_PREFIX,
  SUBPART_DOT_PATTERN,
  SUBPART_PATTERN,
  TOP_LEVEL_PATTERN,
} from "./question-patterns";
import { extractMaxMarks } from "./question-marks";

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
 * text of whichever question is currently open. A standalone "OR" line
 * between two questions links them as alternatives (`choiceGroup`) — the
 * paper only expects one of them to be answered.
 */
export function parseQuestions(rawText: string): Question[] {
  const lines = rawText.split(/\r?\n/);
  const questions: Question[] = [];
  let current: Question | null = null;
  let choicePartner: Question | null = null;

  for (const line of lines) {
    if (!line.trim()) continue;

    if (OR_LINE_PATTERN.test(line) && current) {
      choicePartner = current;
      continue;
    }

    const label = matchLabel(line);
    if (label) {
      current = {
        id: `q-${questions.length + 1}`,
        number: label.number,
        text: label.rest.trim(),
      };
      if (choicePartner) {
        current.choiceGroup = choicePartner.choiceGroup ?? choicePartner.id;
        choicePartner.choiceGroup = current.choiceGroup;
        choicePartner = null;
      }
      questions.push(current);
    } else if (current) {
      current.text = `${current.text} ${line.trim()}`.trim();
    }
  }

  // A question's marks annotation (e.g. "[5]") only appears once the full
  // text — including any continuation lines — has been assembled, so this
  // is a separate pass rather than done inline above.
  return questions.map((q) => {
    const { text, maxMarks } = extractMaxMarks(q.text);
    return maxMarks === undefined ? q : { ...q, text, maxMarks };
  });
}
