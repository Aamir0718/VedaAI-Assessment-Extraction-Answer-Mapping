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

/** Deterministic, dependency-free validation — no AI, no I/O. */
export function validateFile(file: FileInput): FileValidationResult {
  if (file.buffer.byteLength === 0) {
    return { valid: false, error: `"${file.name}" is empty.` };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimeType as (typeof ALLOWED_MIME_TYPES)[number])) {
    return {
      valid: false,
      error: `"${file.name}" has an unsupported file type (${file.mimeType}). Upload a PDF, PNG, JPEG, or WebP.`,
    };
  }

  const max = maxFileSizeBytes();
  if (file.buffer.byteLength > max) {
    const maxMb = Math.round(max / (1024 * 1024));
    return { valid: false, error: `"${file.name}" exceeds the ${maxMb}MB size limit.` };
  }

  return { valid: true };
}
