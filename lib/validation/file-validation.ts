/** One uploaded file's raw bytes. */
export type FilePart = { buffer: Buffer; mimeType: string };

/**
 * A single logical document — either one PDF (its pages live inside the
 * PDF itself) or one-or-more images, each representing one page in the
 * order given. Never a mix of the two.
 */
export type FileInput = { parts: FilePart[]; name: string };

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

/** Also used client-side purely for display ("Max 20MB") — a real env override still wins server-side. */
export const DEFAULT_MAX_FILE_SIZE_MB = 20;

function maxFileSizeBytes(): number {
  const configured = Number(process.env.MAX_FILE_SIZE_MB);
  const mb = Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_MAX_FILE_SIZE_MB;
  return mb * 1024 * 1024;
}

export type FileValidationResult =
  | { valid: true }
  | { valid: false; error: string };

type FileMeta = { type: string; size: number; name: string };

/** Shared by every validation path below — metadata only, no bytes. */
function validateMeta(file: FileMeta): FileValidationResult {
  if (file.size === 0) {
    return { valid: false, error: `"${file.name}" is empty.` };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return {
      valid: false,
      error: `"${file.name}" has an unsupported file type (${file.type}). Upload a PDF, PNG, JPEG, or WebP.`,
    };
  }

  const max = maxFileSizeBytes();
  if (file.size > max) {
    const maxMb = Math.round(max / (1024 * 1024));
    return { valid: false, error: `"${file.name}" exceeds the ${maxMb}MB size limit.` };
  }

  return { valid: true };
}

/**
 * Same rules, usable directly against a browser File's metadata (no bytes
 * read) for instant feedback on selection — the server still re-validates
 * authoritatively, this only makes the common case feel instant.
 */
export function validateFileMeta(file: FileMeta): FileValidationResult {
  return validateMeta(file);
}

/**
 * Authoritative server-side check for one whole document. Validates every
 * page/part individually, and — when there's more than one — requires
 * they all be images: a PDF is a complete document on its own and can't
 * be combined with anything else.
 */
export function validateFileInput(input: FileInput): FileValidationResult {
  if (input.parts.length === 0) {
    return { valid: false, error: `"${input.name}" has no pages.` };
  }

  for (const part of input.parts) {
    const check = validateMeta({ type: part.mimeType, size: part.buffer.byteLength, name: input.name });
    if (!check.valid) return check;
  }

  if (input.parts.length > 1 && input.parts.some((p) => p.mimeType === "application/pdf")) {
    return {
      valid: false,
      error: `"${input.name}": a PDF must be uploaded on its own, not combined with other files.`,
    };
  }

  return { valid: true };
}
