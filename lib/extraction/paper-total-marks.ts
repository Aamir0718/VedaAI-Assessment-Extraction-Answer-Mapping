// Header info ("Total Marks: 100", "Maximum Marks: 80") is always printed
// near the top of the paper, before the first question — searching only
// this prefix avoids matching an unrelated number deep in the questions.
const HEADER_WINDOW = 400;
const TOTAL_MARKS_PATTERN = /(?:total|maximum|max\.?)\s*marks?\s*[:\-–]?\s*(\d{1,3})\b/i;

/**
 * The paper's own stated total, when printed — more reliable than summing
 * every extracted question, since that sum can't account for optional/
 * choice-based questions the paper doesn't expect all of to be answered.
 */
export function extractPaperTotalMarks(rawText: string): number | undefined {
  const match = rawText.slice(0, HEADER_WINDOW).match(TOTAL_MARKS_PATTERN);
  return match ? Number(match[1]) : undefined;
}
