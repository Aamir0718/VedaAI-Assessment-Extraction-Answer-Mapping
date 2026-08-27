import { afterEach, describe, expect, it } from "vitest";
import { validateFile, type FileInput } from "@/lib/validation/file-validation";

function file(overrides: Partial<FileInput> = {}): FileInput {
  return {
    buffer: Buffer.from("dummy"),
    mimeType: "application/pdf",
    name: "paper.pdf",
    ...overrides,
  };
}

describe("validateFile", () => {
  afterEach(() => {
    delete process.env.MAX_FILE_SIZE_MB;
  });

  it("accepts a valid PDF", () => {
    expect(validateFile(file())).toEqual({ valid: true });
  });

  it("accepts allowed image types", () => {
    expect(validateFile(file({ mimeType: "image/png" }))).toEqual({ valid: true });
    expect(validateFile(file({ mimeType: "image/jpeg" }))).toEqual({ valid: true });
  });

  it("rejects an unsupported mime type", () => {
    const result = validateFile(file({ mimeType: "application/msword" }));
    expect(result.valid).toBe(false);
  });

  it("rejects an empty file", () => {
    const result = validateFile(file({ buffer: Buffer.alloc(0) }));
    expect(result.valid).toBe(false);
  });

  it("rejects a file over the configured size limit", () => {
    process.env.MAX_FILE_SIZE_MB = "1";
    const oversized = Buffer.alloc(2 * 1024 * 1024);
    const result = validateFile(file({ buffer: oversized }));
    expect(result.valid).toBe(false);
  });

  it("accepts a file within a custom size limit", () => {
    process.env.MAX_FILE_SIZE_MB = "1";
    const smallEnough = Buffer.alloc(512 * 1024);
    expect(validateFile(file({ buffer: smallEnough })).valid).toBe(true);
  });
});
