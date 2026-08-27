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

  it("picks up each question's own printed marks, not a generic default", () => {
    const text = `
      1. What is the capital of France? [2]
      2. Define photosynthesis. (5 marks)
      3. Solve for x: 2x + 4 = 10
    `;
    const result = parseQuestions(text);
    expect(result[0]).toMatchObject({ text: "What is the capital of France?", maxMarks: 2 });
    expect(result[1]).toMatchObject({ text: "Define photosynthesis.", maxMarks: 5 });
    expect(result[2].maxMarks).toBeUndefined(); // no annotation printed — left for the grading fallback
  });

  it("extracts marks after continuation lines are fully assembled", () => {
    const text = `
      1. This question spans
      multiple lines before its marks. [4]
      2. Short one.
    `;
    const result = parseQuestions(text);
    expect(result[0]).toMatchObject({
      text: "This question spans multiple lines before its marks.",
      maxMarks: 4,
    });
  });

  it("links two questions separated by a standalone 'OR' line into the same choice group", () => {
    const text = `
      5(a) Explain Newton's first law. [5]
      OR
      5(b) Explain Newton's second law. [5]
      6. An unrelated question.
    `;
    const result = parseQuestions(text);
    const [a, b, six] = result;
    expect(a.choiceGroup).toBeDefined();
    expect(a.choiceGroup).toBe(b.choiceGroup);
    expect(six.choiceGroup).toBeUndefined();
  });

  it("accepts dashed OR variants like '-- OR --'", () => {
    const text = `
      1. First option.
      -- OR --
      2. Second option.
    `;
    const result = parseQuestions(text);
    expect(result[0].choiceGroup).toBe(result[1].choiceGroup);
  });

  it("does not treat 'or' inside a real sentence as a choice marker", () => {
    const text = `
      1. Explain the difference between speed or velocity.
      2. Second question.
    `;
    const result = parseQuestions(text);
    expect(result[0].choiceGroup).toBeUndefined();
    expect(result[1].choiceGroup).toBeUndefined();
  });
});
