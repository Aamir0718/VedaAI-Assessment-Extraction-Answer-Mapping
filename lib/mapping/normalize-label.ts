/**
 * Canonicalizes a question-number label so variants written differently
 * resolve to the same key: "Q11(a)", "11 (a)", "11.a", and "11(a)" all
 * become "11a". Returns null if the input has no recognizable number.
 */
export function normalizeLabel(raw: string): string | null {
  let text = raw.trim().toLowerCase();
  if (!text) return null;

  // Strip an optional leading "Q"/"Question" prefix.
  text = text.replace(/^q(?:uestion)?\.?\s*/, "");

  // Collapse separators between a number and its sub-part into nothing:
  // "11 (a)" / "11(a)" / "11.a" / "11-a" all become "11a".
  const match = text.match(/^(\d{1,3})\s*[.\-(]?\s*([a-z]+|[ivxlcdm]+)?\s*\)?\s*$/i);
  if (!match) return null;

  const [, number, part] = match;
  return part ? `${number}${part}` : number;
}
