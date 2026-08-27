import type { AssessmentResult } from "@/types/assessment";

/** Fixed, ordered stage sequence — the UI never needs to guess what's next. */
export const STAGE_ORDER = [
  "files-uploaded",
  "reading-question-paper",
  "questions-extracted",
  "reading-answer-sheet",
  "mapping-answers",
  "preparing-results",
] as const;
export type StageId = (typeof STAGE_ORDER)[number];

export type ProcessEvent =
  | { type: "stage"; id: StageId; label: string }
  | { type: "result"; result: AssessmentResult }
  | { type: "error"; message: string };

export function stageEvent(id: StageId, label: string): ProcessEvent {
  return { type: "stage", id, label };
}

/** Shown for a stage the UI hasn't received an event for yet. */
export const DEFAULT_STAGE_LABELS: Record<StageId, string> = {
  "files-uploaded": "Files uploaded",
  "reading-question-paper": "Reading question paper",
  "questions-extracted": "Extracting questions",
  "reading-answer-sheet": "Reading answer sheet",
  "mapping-answers": "Mapping answers",
  "preparing-results": "Preparing results",
};

/** "Extracted 1 question" / "Extracted 15 questions" — no separate pluralization util needed. */
export function describeCount(count: number, noun: string): string {
  return `Extracted ${count} ${noun}${count === 1 ? "" : "s"}`;
}
