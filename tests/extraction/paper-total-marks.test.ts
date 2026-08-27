import { describe, expect, it } from "vitest";
import { extractPaperTotalMarks } from "@/lib/extraction/paper-total-marks";

describe("extractPaperTotalMarks", () => {
  it("finds a 'Total Marks: 100' style header", () => {
    const text = "Class 10 Mathematics\nTime: 3 Hours   Total Marks: 100\n\n1. Solve for x.";
    expect(extractPaperTotalMarks(text)).toBe(100);
  });

  it("finds 'Maximum Marks' and 'Max Marks' variants", () => {
    expect(extractPaperTotalMarks("Maximum Marks: 80\n1. Q one.")).toBe(80);
    expect(extractPaperTotalMarks("Max Marks - 70\n1. Q one.")).toBe(70);
  });

  it("returns undefined when there's no printed total", () => {
    expect(extractPaperTotalMarks("1. What is the capital of France? [2]")).toBeUndefined();
  });

  it("ignores a marks-like number that only appears deep in the questions", () => {
    const farText = "1. " + "x".repeat(500) + " Total Marks in this town: 12";
    expect(extractPaperTotalMarks(farText)).toBeUndefined();
  });
});
