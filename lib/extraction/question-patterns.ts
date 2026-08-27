// Regex patterns recognizing printed question numbering styles.
// Order matters: more specific (sub-part) patterns are tried before the
// plain top-level pattern so "11(a)" isn't first captured as just "11".

/** Matches a line-start label like "11(a)", "11 (a)", "12(ii)". */
export const SUBPART_PATTERN = /^\s*(\d{1,3})\s*\(\s*([a-zA-Z]+|[ivxlcdm]+)\s*\)\s*[.)]?\s+/;

/** Matches a line-start label like "11.a" or "11-a". */
export const SUBPART_DOT_PATTERN = /^\s*(\d{1,3})\s*[.\-]\s*([a-zA-Z])\s+/;

/** Matches a plain top-level label like "1.", "2)", "3 -". */
export const TOP_LEVEL_PATTERN = /^\s*(\d{1,3})\s*[.)]\s+/;

/** Optional leading "Q"/"Question" prefix, stripped before pattern matching. */
export const QUESTION_PREFIX = /^\s*(?:Q(?:uestion)?\.?\s*)/i;
