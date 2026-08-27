import type { Answer, Question } from "@/types/assessment";
import { DEFAULT_MAX_MARKS } from "@/lib/evaluation/total-marks";

// Every prompt asks for minimal, structured JSON only — no prose, no
// reasoning field — since output is schema-validated immediately after.

export const QUESTION_EXTRACTION_PROMPT = `You are reading a printed exam question paper.
Extract every question and labelled sub-part (e.g. "11(a)" and "11(b)" are
two separate entries) in the exact order they are printed, preserving the
original numbering exactly as written. If a mark/point value is printed
next to a question (in a table column or inline, e.g. "[5]", "(10 marks)",
or just a bare "10"), report it as maxMarks and do not include the
annotation itself in "text".
If the paper offers a choice between whole questions (e.g. "Q1 OR Q2",
"Answer Q1 or Q2", questions grouped under one module where only one is
required), give every question and sub-part on BOTH sides of that choice
the same "choiceGroup" string — only questions the paper actually presents
as alternatives to each other, never questions that are all required.
If the paper prints its own overall total (e.g. "Max Marks: 100",
"Total Marks: 80") anywhere, report it as paperTotalMarks — this is
normally different from (smaller than) the sum of every question's marks,
since students only answer some of what's printed when choices exist.
Return ONLY a JSON object: {
  "questions": [{ "number": string, "text": string, "maxMarks"?: number, "choiceGroup"?: string }],
  "paperTotalMarks"?: number
}
No markdown, no commentary, no extra fields.`;

export const ANSWER_EXTRACTION_PROMPT = `You are reading a student's handwritten answer sheet (possibly multiple pages).
If given as a single PDF, its own pages are the page numbers. If given as
multiple separate images, they are provided in order as consecutive pages
starting at page 1 — the first image is page 1, the second is page 2, etc.
Transcribe every distinct answer. For each answer, detect the question label
the student wrote if legible (e.g. "Q5", "11(a)"), and report every visual
region it occupies as a normalized (0 to 1) bounding box per page. An answer
spanning multiple pages should have one region per page it appears on.
Return ONLY a JSON array, each item: {
  "text": string,
  "detectedQuestionNumber"?: string,
  "regions": [{ "page": number (1-indexed), "x": number, "y": number, "width": number, "height": number }]
}
No markdown, no commentary, no extra fields.`;

/** Answers that survived deterministic matching still need a label/candidate list. */
export function ambiguousMappingPrompt(
  answers: Answer[],
  candidates: Question[]
): string {
  const answerList = answers.map((a) => ({
    id: a.id,
    text: a.text,
    detectedQuestionNumber: a.detectedQuestionNumber,
  }));
  const candidateList = candidates.map((q) => ({ id: q.id, number: q.number, text: q.text }));

  return `You are matching handwritten answers to exam questions by meaning, because
neither an explicit label nor position could resolve them deterministically.
Answers: ${JSON.stringify(answerList)}
Candidate questions: ${JSON.stringify(candidateList)}
For each answer, pick the single best-matching candidate question ONLY if you
are genuinely confident; otherwise return method "unmapped" with no questionId.
Never guess. Return ONLY a JSON array, each item: {
  "answerId": string, "questionId"?: string, "confidence": number (0 to 1),
  "method": "semantic" | "unmapped"
}`;
}

/** Grading is graded per mapped pair, all in a single batched call. */
export function evaluationPrompt(pairs: { question: Question; answer: Answer }[]): string {
  const items = pairs.map((p) => ({
    questionId: p.question.id,
    questionText: p.question.text,
    maxMarks: p.question.maxMarks ?? DEFAULT_MAX_MARKS,
    answerText: p.answer.text,
  }));

  return `You are grading student answers against their questions.
Pairs: ${JSON.stringify(items)}
For each pair, give marks out of the given maxMarks and brief, specific feedback
(1-2 sentences: what's correct, what's missing). Return ONLY a JSON array, each
item: { "questionId": string, "marks": number, "maxMarks": number, "feedback": string }`;
}
