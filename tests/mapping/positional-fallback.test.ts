import { describe, expect, it } from "vitest";
import { positionalFallback } from "@/lib/mapping/positional-fallback";
import { answer, question } from "../fixtures/mapping-fixtures";

describe("positionalFallback", () => {
  it("pairs answers to questions in order when counts match exactly", () => {
    const questions = [question("1"), question("2")];
    const answers = [answer("a-1", "First"), answer("a-2", "Second")];

    const result = positionalFallback(answers, questions);

    expect(result.map((m) => m.questionId)).toEqual(["q-1", "q-2"]);
    expect(result.every((m) => m.method === "positional")).toBe(true);
  });

  it("maps nothing when the counts don't match — too ambiguous to guess", () => {
    const questions = [question("1")];
    const answers = [answer("a-1", "First"), answer("a-2", "Second")];

    expect(positionalFallback(answers, questions)).toEqual([]);
  });

  it("returns an empty array when there are no unlabeled answers", () => {
    expect(positionalFallback([], [question("1")])).toEqual([]);
  });
});
