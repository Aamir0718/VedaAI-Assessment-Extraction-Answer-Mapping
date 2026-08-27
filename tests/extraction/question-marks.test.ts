import { describe, expect, it } from "vitest";
import { extractMaxMarks } from "@/lib/extraction/question-marks";

describe("extractMaxMarks", () => {
  it("extracts marks in square brackets", () => {
    expect(extractMaxMarks("What is the capital of France? [2]")).toEqual({
      text: "What is the capital of France?",
      maxMarks: 2,
    });
  });

  it("extracts marks written as '(5 marks)'", () => {
    expect(extractMaxMarks("Explain photosynthesis in detail. (5 marks)")).toEqual({
      text: "Explain photosynthesis in detail.",
      maxMarks: 5,
    });
  });

  it("extracts marks written as '[3 Marks]' or '[3M]'", () => {
    expect(extractMaxMarks("Explain Newton's first law. [3 Marks]").maxMarks).toBe(3);
    expect(extractMaxMarks("Explain Newton's first law. [3M]").maxMarks).toBe(3);
  });

  it("leaves text with no marks annotation untouched", () => {
    expect(extractMaxMarks("Solve for x: 2x + 4 = 10")).toEqual({
      text: "Solve for x: 2x + 4 = 10",
    });
  });

  it("does not mistake a genuine parenthetical for a marks annotation", () => {
    const text = "Define osmosis (with a real-world example).";
    expect(extractMaxMarks(text)).toEqual({ text });
  });

  it("does not mistake a numeric answer in parentheses for marks mid-sentence", () => {
    const text = "A shape has interior angles summing to (n-2) x 180.";
    expect(extractMaxMarks(text).maxMarks).toBeUndefined();
  });
});
