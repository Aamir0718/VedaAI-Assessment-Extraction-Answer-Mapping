// Regex patterns recognizing printed question numbering styles.
// Order matters: more specific (sub-part) patterns are tried before the
// plain top-level pattern so "11(a)" isn't first captured as just "11".

/** Matches a line-start label like "11(a)", "11 (a)", "12(ii)". */
export const SUBPART_PATTERN = /^\s*(\d{1,3})\s*\(\s*([a-zA-Z]+|[ivxlcdm]+)\s*\)\s*[.)]?\s+/;

/** Matches a line-start label like "11.a" or "11-a". */
export const SUBPART_DOT_PATTERN = /^\s*(\d{1,3})\s*[.\-]\s*([a-zA-Z])\s+/;

/** Matches a line-start label like "1 a." or "11 b)" — number and letter as separate table-cell-style tokens. */
export const SUBPART_SPACE_PATTERN = /^\s*(\d{1,3})\s+([a-zA-Z])\s*[.)]\s+/;

/** Matches a plain top-level label like "1.", "2)", "3 -". */
export const TOP_LEVEL_PATTERN = /^\s*(\d{1,3})\s*[.)]\s+/;

/** Optional leading "Q"/"Question" prefix, stripped before pattern matching. */
export const QUESTION_PREFIX = /^\s*(?:Q(?:uestion)?\.?\s*)/i;

/** A standalone "OR" line — printed between two alternative questions the student picks one of. */
export const OR_LINE_PATTERN = /^\s*-{0,3}\s*or\s*-{0,3}\s*$/i;

/** A "Module - 2" / "Module – 3" style section heading — not part of any question's text. */
export const MODULE_HEADING_PATTERN = /^\s*module\s*[-–]?\s*\d+\s*$/i;
