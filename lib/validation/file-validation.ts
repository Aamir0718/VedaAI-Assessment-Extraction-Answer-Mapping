/** Raw bytes of an uploaded document, independent of how it arrived. */
export type FileInput = {
  buffer: Buffer;
  mimeType: string;
  name: string;
};

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

/** Shared by the server check (below) and the client pre-check — metadata only, no bytes. */
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

/** Deterministic, dependency-free validation — no AI, no I/O. Authoritative check, run server-side. */
export function validateFile(file: FileInput): FileValidationResult {
  return validateMeta({ type: file.mimeType, size: file.buffer.byteLength, name: file.name });
}

/**
 * Same rules, usable directly against a browser File's metadata (no bytes
 * read) for instant feedback on selection — the server still re-validates
 * authoritatively, this only makes the common case feel instant.
 */
export function validateFileMeta(file: FileMeta): FileValidationResult {
  return validateMeta(file);
}
