// Central domain model. The UI and API layers should primarily consume
// AssessmentResult; internal modules pass these types between each other.

/** A single question or labelled sub-part (e.g. "11(a)" is its own Question). */
export type Question = {
  id: string;
  /** Original printed label, e.g. "1", "11(a)", "12(ii)". */
  number: string;
  text: string;
  maxMarks?: number;
};

/** Normalized (0–1) bounding box on one answer-sheet page. */
export type AnswerRegion = {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

/** A transcribed handwritten answer, possibly spanning multiple regions/pages. */
export type Answer = {
  id: string;
  text: string;
  /** Question number as handwritten by the student, if legible (e.g. "Q5"). */
  detectedQuestionNumber?: string;
  regions: AnswerRegion[];
};

export type MappingMethod =
  | "explicit-label"
  | "normalized-label"
  | "positional"
  | "semantic"
  | "unmapped";

/** Every Answer gets exactly one AnswerMapping — questionId is absent when unmapped. */
export type AnswerMapping = {
  answerId: string;
  questionId?: string;
  confidence: number;
  method: MappingMethod;
};

export type Evaluation = {
  questionId: string;
  marks: number;
  maxMarks: number;
  feedback: string;
};

export type AssessmentResult = {
  questions: Question[];
  answers: Answer[];
  mappings: AnswerMapping[];
  evaluations?: Evaluation[];
};
