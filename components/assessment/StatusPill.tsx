import type { AnswerMapping, Evaluation } from "@/types/assessment";

type Props = {
  evaluation: Evaluation | null;
  mapping: AnswerMapping | null;
  /** This question's OR-choice partner was answered instead — skipping it was legitimate, not a miss. */
  skippedByChoice?: boolean;
};

const BASE = "shrink-0 rounded-pill px-2 py-0.5 text-xs font-semibold";

/** Shows the mark once graded; otherwise the mapping confidence — never both. */
export function StatusPill({ evaluation, mapping, skippedByChoice }: Props) {
  if (evaluation) {
    const pct = evaluation.maxMarks > 0 ? evaluation.marks / evaluation.maxMarks : 0;
    const color =
      pct >= 0.7
        ? "bg-success-100 text-success-600"
        : pct >= 0.4
          ? "bg-warning-100 text-warning-600"
          : "bg-danger-100 text-danger-600";
    return (
      <span className={`${BASE} ${color}`}>
        {evaluation.marks}/{evaluation.maxMarks}
      </span>
    );
  }

  if (!mapping) {
    return skippedByChoice ? (
      <span className={`${BASE} bg-ink-100 text-ink-400`}>Optional — not needed</span>
    ) : (
      <span className={`${BASE} bg-ink-100 text-ink-400`}>Unanswered</span>
    );
  }
  if (mapping.method === "unmapped") return <span className={`${BASE} bg-danger-100 text-danger-500`}>Unmatched</span>;
  if (mapping.confidence < 0.7) return <span className={`${BASE} bg-warning-100 text-warning-600`}>Needs review</span>;
  return <span className={`${BASE} bg-success-100 text-success-600`}>Mapped</span>;
}
