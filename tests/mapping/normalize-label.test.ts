import { describe, expect, it } from "vitest";
import { normalizeLabel } from "@/lib/mapping/normalize-label";

describe("normalizeLabel", () => {
  it("resolves all spec-listed sub-part variants to the same key", () => {
    const variants = ["11(a)", "11 (a)", "Q11(a)", "Q11 (a)", "11.a"];
    const normalized = variants.map(normalizeLabel);
    expect(new Set(normalized).size).toBe(1);
    expect(normalized[0]).toBe("11a");
  });

  it("normalizes a plain top-level number regardless of Q prefix", () => {
    expect(normalizeLabel("5")).toBe("5");
    expect(normalizeLabel("Q5")).toBe("5");
    expect(normalizeLabel("Question 5")).toBe("5");
    expect(normalizeLabel("5)")).toBe("5");
  });

  it("distinguishes roman-numeral sub-parts from each other", () => {
    expect(normalizeLabel("12(i)")).toBe("12i");
    expect(normalizeLabel("12(ii)")).toBe("12ii");
    expect(normalizeLabel("12(i)")).not.toBe(normalizeLabel("12(ii)"));
  });

  it("returns null for unrecognizable input", () => {
    expect(normalizeLabel("")).toBeNull();
    expect(normalizeLabel("the answer is")).toBeNull();
  });
});
