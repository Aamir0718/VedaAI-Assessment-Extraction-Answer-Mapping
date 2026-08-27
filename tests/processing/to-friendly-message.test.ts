import { describe, expect, it } from "vitest";
import { AiOutputError } from "@/lib/ai/types";
import { toFriendlyMessage } from "@/lib/processing/to-friendly-message";

describe("toFriendlyMessage", () => {
  it("never leaks the raw AI error detail", () => {
    const err = new AiOutputError("Gemini output failed schema validation.", { some: "internal detail" });
    const message = toFriendlyMessage(err);
    expect(message).not.toContain("schema validation");
    expect(message).not.toContain("internal detail");
  });

  it("recognizes pdfjs's real corrupt-PDF error message", () => {
    const message = toFriendlyMessage(new Error("Invalid PDF structure."));
    expect(message).toMatch(/corrupted or unreadable/i);
  });

  it("recognizes a password-protected PDF as corrupt/unreadable, not a generic failure", () => {
    const message = toFriendlyMessage(new Error("PasswordException: No password given"));
    expect(message).toMatch(/corrupted or unreadable/i);
  });

  it("falls back to a generic message for anything else, never the raw error text", () => {
    const message = toFriendlyMessage(new Error("ECONNRESET: socket hang up at line 42"));
    expect(message).not.toContain("ECONNRESET");
    expect(message).not.toContain("line 42");
  });

  it("handles a thrown non-Error value without crashing", () => {
    expect(() => toFriendlyMessage("just a string")).not.toThrow();
    expect(() => toFriendlyMessage(undefined)).not.toThrow();
  });
});
