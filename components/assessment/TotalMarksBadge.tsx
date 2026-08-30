import type { Evaluation, Question } from "@/types/assessment";
import { computeTotalMarks } from "@/lib/evaluation/total-marks";

type Props = { questions: Question[]; evaluations: Evaluation[]; paperTotalMarks?: number };

/** The whole-paper score — only meaningful (and only shown) once grading has run. */
export function TotalMarksBadge({ questions, evaluations, paperTotalMarks }: Props) {
  if (evaluations.length === 0) return null;

  const { earned, possible } = computeTotalMarks(questions, evaluations, paperTotalMarks);

  return (
    <div className="animate-fade-up mb-3 flex items-center justify-between rounded-card bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3 text-white shadow-sm">
      <span className="text-xs font-medium uppercase tracking-wide opacity-90">Total score</span>
      <span className="font-display text-xl font-bold">
        {earned}
        <span className="text-sm font-medium opacity-80">/{possible}</span>
      </span>
    </div>
  );
}
