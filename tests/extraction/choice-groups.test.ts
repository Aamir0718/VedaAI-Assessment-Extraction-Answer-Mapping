import { describe, expect, it } from "vitest";
import { applyChoiceGroups } from "@/lib/extraction/choice-groups";
import { question } from "../fixtures/mapping-fixtures";

describe("applyChoiceGroups", () => {
  it("links every sub-part of two whole questions separated by OR, not just the adjacent pair", () => {
    const questions = [
      question("1(a)"),
      question("1(b)"),
      question("2(a)"),
      question("2(b)"),
      question("3(a)"),
      question("3(b)"),
    ];
    // "OR" appeared right before 2(a) — the first question of the run after it.
    const afterOr = [false, false, true, false, false, false];

    const result = applyChoiceGroups(questions, afterOr);
    const [q1a, q1b, q2a, q2b, q3a, q3b] = result;

    expect(q1a.choiceGroup).toBeDefined();
    expect(q1a.choiceGroup).toBe(q1b.choiceGroup);
    expect(q1a.choiceGroup).toBe(q2a.choiceGroup);
    expect(q1a.choiceGroup).toBe(q2b.choiceGroup);
    expect(q3a.choiceGroup).toBeUndefined();
    expect(q3b.choiceGroup).toBeUndefined();
  });

  it("links two single sub-parts of the same number separated by OR (e.g. '5(a) OR 5(b)')", () => {
    const questions = [question("5(a)"), question("5(b)")];
    const afterOr = [false, true];

    const result = applyChoiceGroups(questions, afterOr);
    expect(result[0].choiceGroup).toBe(result[1].choiceGroup);
  });

  it("leaves everything ungrouped when there's no OR at all", () => {
    const questions = [question("1"), question("2"), question("3")];
    const result = applyChoiceGroups(questions, [false, false, false]);
    expect(result.every((q) => q.choiceGroup === undefined)).toBe(true);
  });

  it("handles several independent choice pairs in one paper without cross-linking them", () => {
    const questions = [
      question("1(a)"),
      question("1(b)"),
      question("2(a)"),
      question("2(b)"),
      question("3(a)"),
      question("3(b)"),
      question("4(a)"),
      question("4(b)"),
    ];
    const afterOr = [false, false, true, false, false, false, true, false];

    const result = applyChoiceGroups(questions, afterOr);
    const groupOf = (number: string) => result.find((q) => q.number === number)?.choiceGroup;

    expect(groupOf("1(a)")).toBe(groupOf("2(b)"));
    expect(groupOf("3(a)")).toBe(groupOf("4(b)"));
    expect(groupOf("1(a)")).not.toBe(groupOf("3(a)"));
  });
});
