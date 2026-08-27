type Status = "done" | "active" | "pending";

const ICON: Record<Status, string> = { done: "✓", active: "●", pending: "○" };
const COLOR: Record<Status, string> = {
  done: "text-emerald-600",
  active: "text-blue-600",
  pending: "text-neutral-400",
};

export function StageItem({ label, status }: { label: string; status: Status }) {
  return (
    <li className={`flex items-center gap-2 text-sm ${COLOR[status]}`}>
      <span aria-hidden>{ICON[status]}</span>
      <span>{label}</span>
    </li>
  );
}
