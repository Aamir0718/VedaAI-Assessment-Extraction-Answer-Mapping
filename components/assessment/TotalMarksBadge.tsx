import type { Evaluation, Question } from "@/types/assessment";
import { computeTotalMarks } from "@/lib/evaluation/total-marks";

type Props = { questions: Question[]; evaluations: Evaluation[]; paperTotalMarks?: number };

/** The whole-paper score — only meaningful (and only shown) once grading has run. */
export function TotalMarksBadge({ questions, evaluations, paperTotalMarks }: Props) {
  if (evaluations.length === 0) return null;

  const { earned, possible } = computeTotalMarks(questions, evaluations, paperTotalMarks);
  const pct = possible > 0 ? earned / possible : 0;
  const gradient =
    pct >= 0.7 ? "from-emerald-500 to-emerald-400" : pct >= 0.4 ? "from-amber-500 to-amber-400" : "from-red-500 to-red-400";

  return (
    <div
      className={`animate-fade-up mb-3 flex items-center justify-between rounded-xl bg-gradient-to-r ${gradient} px-4 py-3 text-white shadow-sm`}
    >
      <span className="text-xs font-medium uppercase tracking-wide opacity-90">Total score</span>
      <span className="font-display text-xl font-bold">
        {earned}
        <span className="text-sm font-medium opacity-80">/{possible}</span>
      </span>
    </div>
  );
}
