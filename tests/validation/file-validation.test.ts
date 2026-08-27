import { afterEach, describe, expect, it } from "vitest";
import { validateFileInput, validateFileMeta, type FileInput } from "@/lib/validation/file-validation";

function doc(overrides: Partial<FileInput> = {}): FileInput {
  return {
    parts: [{ buffer: Buffer.from("dummy"), mimeType: "application/pdf" }],
    name: "paper.pdf",
    ...overrides,
  };
}

describe("validateFileInput", () => {
  afterEach(() => {
    delete process.env.MAX_FILE_SIZE_MB;
  });

  it("accepts a valid single-part PDF", () => {
    expect(validateFileInput(doc())).toEqual({ valid: true });
  });

  it("accepts allowed image types", () => {
    expect(
      validateFileInput(doc({ parts: [{ buffer: Buffer.from("x"), mimeType: "image/png" }] }))
    ).toEqual({ valid: true });
    expect(
      validateFileInput(doc({ parts: [{ buffer: Buffer.from("x"), mimeType: "image/jpeg" }] }))
    ).toEqual({ valid: true });
  });

  it("accepts multiple image pages for one document", () => {
    const result = validateFileInput(
      doc({
        parts: [
          { buffer: Buffer.from("a"), mimeType: "image/jpeg" },
          { buffer: Buffer.from("b"), mimeType: "image/png" },
        ],
      })
    );
    expect(result).toEqual({ valid: true });
  });

  it("rejects a PDF combined with another file", () => {
    const result = validateFileInput(
      doc({
        parts: [
          { buffer: Buffer.from("a"), mimeType: "application/pdf" },
          { buffer: Buffer.from("b"), mimeType: "image/png" },
        ],
      })
    );
    expect(result.valid).toBe(false);
  });

  it("rejects a document with no pages", () => {
    expect(validateFileInput(doc({ parts: [] })).valid).toBe(false);
  });

  it("rejects an unsupported mime type", () => {
    const result = validateFileInput(
      doc({ parts: [{ buffer: Buffer.from("x"), mimeType: "application/msword" }] })
    );
    expect(result.valid).toBe(false);
  });

  it("rejects an empty part", () => {
    const result = validateFileInput(
      doc({ parts: [{ buffer: Buffer.alloc(0), mimeType: "application/pdf" }] })
    );
    expect(result.valid).toBe(false);
  });

  it("rejects a part over the configured size limit", () => {
    process.env.MAX_FILE_SIZE_MB = "1";
    const oversized = Buffer.alloc(2 * 1024 * 1024);
    const result = validateFileInput(doc({ parts: [{ buffer: oversized, mimeType: "application/pdf" }] }));
    expect(result.valid).toBe(false);
  });

  it("accepts a part within a custom size limit", () => {
    process.env.MAX_FILE_SIZE_MB = "1";
    const smallEnough = Buffer.alloc(512 * 1024);
    const result = validateFileInput(doc({ parts: [{ buffer: smallEnough, mimeType: "application/pdf" }] }));
    expect(result.valid).toBe(true);
  });
});

describe("validateFileMeta", () => {
  it("applies the same rules using only type/size/name — no bytes needed", () => {
    expect(validateFileMeta({ type: "application/pdf", size: 1024, name: "a.pdf" })).toEqual({
      valid: true,
    });
    expect(validateFileMeta({ type: "application/msword", size: 1024, name: "a.doc" }).valid).toBe(
      false
    );
    expect(validateFileMeta({ type: "application/pdf", size: 0, name: "a.pdf" }).valid).toBe(false);
  });
});
