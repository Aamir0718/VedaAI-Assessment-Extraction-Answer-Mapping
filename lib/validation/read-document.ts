import type { FileInput } from "./file-validation";

/**
 * A document's pages arrive as one-or-more files under the same form field
 * (a PDF is one file; multiple images are one file per page, in order).
 * Shared by every route that accepts an uploaded document.
 */
export async function readDocument(form: FormData, field: string): Promise<FileInput | null> {
  const files = form.getAll(field).filter((v): v is File => v instanceof File);
  if (files.length === 0) return null;

  const parts = await Promise.all(
    files.map(async (file) => ({ buffer: Buffer.from(await file.arrayBuffer()), mimeType: file.type }))
  );
  return { parts, name: files[0].name };
}
