import { Check, Circle } from "lucide-react";

type Status = "done" | "active" | "pending";

export function StageItem({ label, status }: { label: string; status: Status }) {
  return (
    <li
      className={`flex items-center gap-3 rounded-control px-1.5 py-1 transition-colors duration-300 ${
        status === "active" ? "bg-brand-50" : ""
      }`}
    >
      <span
        className={`flex size-5 shrink-0 scale-100 items-center justify-center rounded-full transition-transform duration-300 ${
          status === "done"
            ? "bg-success-500 text-white"
            : status === "active"
              ? "scale-110 bg-brand-600 text-white"
              : "bg-ink-100 text-ink-400"
        }`}
      >
        {status === "done" ? (
          <Check className="size-3" strokeWidth={3} aria-hidden />
        ) : (
          <Circle className={`size-2 ${status === "active" ? "animate-pulse fill-current" : "fill-current"}`} aria-hidden />
        )}
      </span>
      <span
        className={`text-sm ${
          status === "pending" ? "text-ink-400" : status === "active" ? "font-medium text-ink-900" : "text-ink-700"
        }`}
      >
        {label}
      </span>
    </li>
  );
}
