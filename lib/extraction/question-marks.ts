/** Trailing "[5]", "(5 marks)", "[3M]" — the bracket/paren content must start with a number, so a genuine parenthetical like "(with an example)" is never mistaken for marks. */
const MARKS_PATTERN = /[[(]\s*(\d{1,3})\s*(?:marks?|m)?\s*[\])]\s*$/i;

/**
 * Strips a trailing marks annotation from printed question text and
 * returns the detected value, if any — so the question paper's own marks
 * scheme drives grading instead of a generic default.
 */
export function extractMaxMarks(text: string): { text: string; maxMarks?: number } {
  const match = text.match(MARKS_PATTERN);
  if (!match || match.index === undefined) return { text };

  const cleaned = text.slice(0, match.index).trim();
  if (!cleaned) return { text }; // the "question" was just a marks annotation — not a real match

  return { text: cleaned, maxMarks: Number(match[1]) };
}
