import type { AnswerMapping, Evaluation } from "@/types/assessment";

type Props = { evaluation: Evaluation | null; mapping: AnswerMapping | null };

const BASE = "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold";

/** Shows the mark once graded; otherwise the mapping confidence — never both. */
export function StatusPill({ evaluation, mapping }: Props) {
  if (evaluation) {
    const pct = evaluation.maxMarks > 0 ? evaluation.marks / evaluation.maxMarks : 0;
    const color =
      pct >= 0.7 ? "bg-emerald-100 text-emerald-700" : pct >= 0.4 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600";
    return (
      <span className={`${BASE} ${color}`}>
        {evaluation.marks}/{evaluation.maxMarks}
      </span>
    );
  }

  if (!mapping) return <span className={`${BASE} bg-neutral-100 text-neutral-400`}>Unanswered</span>;
  if (mapping.method === "unmapped") return <span className={`${BASE} bg-red-50 text-red-500`}>Unmatched</span>;
  if (mapping.confidence < 0.7) return <span className={`${BASE} bg-amber-50 text-amber-600`}>Needs review</span>;
  return <span className={`${BASE} bg-emerald-50 text-emerald-600`}>Mapped</span>;
}
