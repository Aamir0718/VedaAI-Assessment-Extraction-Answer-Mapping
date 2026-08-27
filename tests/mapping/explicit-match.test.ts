import { describe, expect, it } from "vitest";
import { explicitMatch } from "@/lib/mapping/explicit-match";
import { answer, question } from "../fixtures/mapping-fixtures";

describe("explicitMatch", () => {
  it("returns null when the answer has no detected label", () => {
    expect(explicitMatch(answer("a-1", "..."), [question("1")])).toBeNull();
  });

  it("returns null when the label matches no candidate question", () => {
    const result = explicitMatch(
      answer("a-1", "...", { detectedQuestionNumber: "99" }),
      [question("1"), question("2")]
    );
    expect(result).toBeNull();
  });

  it("prefers an exact string match over normalization", () => {
    const q = question("11(a)");
    const result = explicitMatch(
      answer("a-1", "...", { detectedQuestionNumber: "11(a)" }),
      [q]
    );
    expect(result).toMatchObject({ questionId: q.id, method: "explicit-label" });
  });

  it("falls back to normalized-label matching for a differently formatted label", () => {
    const q = question("11(a)");
    const result = explicitMatch(
      answer("a-1", "...", { detectedQuestionNumber: "Q11 (a)" }),
      [q]
    );
    expect(result).toMatchObject({ questionId: q.id, method: "normalized-label" });
  });
});
