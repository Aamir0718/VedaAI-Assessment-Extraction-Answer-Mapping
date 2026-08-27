import { describe, expect, it } from "vitest";
import { parseQuestions } from "@/lib/extraction/question-parser";

describe("parseQuestions", () => {
  it("extracts sequential top-level questions in order", () => {
    const text = `
      Instructions: answer all questions.
      1. What is the capital of France?
      2. Define photosynthesis.
      3. Solve for x: 2x + 4 = 10
    `;
    const result = parseQuestions(text);
    expect(result.map((q) => q.number)).toEqual(["1", "2", "3"]);
    expect(result[0].text).toBe("What is the capital of France?");
  });

  it("treats labelled sub-parts as independent questions, not merged", () => {
    const text = `
      11(a) Explain Newton's first law.
      11(b) Explain Newton's second law.
      12(i) What is inertia?
      12(ii) What is momentum?
    `;
    const result = parseQuestions(text);
    expect(result.map((q) => q.number)).toEqual([
      "11(a)",
      "11(b)",
      "12(i)",
      "12(ii)",
    ]);
    expect(result).toHaveLength(4);
  });

  it("accepts spaced and dotted sub-part variants", () => {
    const text = `
      11 (a) First part.
      11.b Second part.
    `;
    const result = parseQuestions(text);
    expect(result.map((q) => q.number)).toEqual(["11(a)", "11(b)"]);
  });

  it("preserves original printed order even if numbering is non-sequential", () => {
    const text = `
      5. Question five.
      2. Question two.
      9. Question nine.
    `;
    const result = parseQuestions(text);
    expect(result.map((q) => q.number)).toEqual(["5", "2", "9"]);
  });

  it("appends continuation lines to the currently open question", () => {
    const text = `
      1. This is a long question that
      spans multiple printed lines
      before the next one starts.
      2. Short question.
    `;
    const result = parseQuestions(text);
    expect(result[0].text).toBe(
      "This is a long question that spans multiple printed lines before the next one starts."
    );
  });

  it("returns an empty array for text with no recognizable labels", () => {
    const text = "This is just a paragraph of prose with no question marks.";
    expect(parseQuestions(text)).toEqual([]);
  });

  it("ignores an optional leading Q/Question prefix", () => {
    const text = `
      Q1. First question.
      Question 2. Second question.
      Q3. Third question.
    `;
    const result = parseQuestions(text);
    expect(result.map((q) => q.number)).toEqual(["1", "2", "3"]);
  });
});
