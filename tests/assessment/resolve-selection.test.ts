import { describe, expect, it } from "vitest";
import { resolveSelection } from "@/lib/assessment/resolve-selection";
import { answer } from "../fixtures/mapping-fixtures";

describe("resolveSelection", () => {
  const mappings = [
    { answerId: "a-1", questionId: "q-1", confidence: 0.9, method: "explicit-label" as const },
    { answerId: "a-2", confidence: 0, method: "unmapped" as const },
  ];
  const answers = [answer("a-1", "Paris"), answer("a-2", "unrelated")];

  it("resolves the mapping and answer for a selected question", () => {
    const result = resolveSelection({ kind: "question", id: "q-1" }, mappings, answers);
    expect(result.mapping?.answerId).toBe("a-1");
    expect(result.answer?.id).toBe("a-1");
  });

  it("resolves an unmatched answer directly, with no question mapping", () => {
    const result = resolveSelection({ kind: "answer", id: "a-2" }, mappings, answers);
    expect(result.answer?.id).toBe("a-2");
    expect(result.mapping?.method).toBe("unmapped");
  });

  it("returns nulls for an unanswered question with no mapping at all", () => {
    const result = resolveSelection({ kind: "question", id: "q-does-not-exist" }, mappings, answers);
    expect(result.mapping).toBeNull();
    expect(result.answer).toBeNull();
  });

  it("returns nulls when nothing is selected", () => {
    const result = resolveSelection(null, mappings, answers);
    expect(result).toEqual({ mapping: null, answer: null });
  });
});
