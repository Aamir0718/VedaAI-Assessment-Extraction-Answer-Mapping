import { Check, Circle } from "lucide-react";

type Status = "done" | "active" | "pending";

export function StageItem({ label, status }: { label: string; status: Status }) {
  return (
    <li
      className={`flex items-center gap-3 rounded-lg px-1.5 py-1 transition-colors duration-300 ${
        status === "active" ? "bg-orange-50" : ""
      }`}
    >
      <span
        className={`flex size-5 shrink-0 scale-100 items-center justify-center rounded-full transition-transform duration-300 ${
          status === "done"
            ? "bg-emerald-500 text-white"
            : status === "active"
              ? "scale-110 bg-orange-500 text-white"
              : "bg-neutral-100 text-neutral-300"
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
          status === "pending" ? "text-neutral-400" : status === "active" ? "font-medium text-neutral-900" : "text-neutral-600"
        }`}
      >
        {label}
      </span>
    </li>
  );
}
