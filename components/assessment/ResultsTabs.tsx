type Tab = "questions" | "sheet";

/** Mobile-only switcher — the desktop layout shows both panes side by side. */
export function ResultsTabs({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  return (
    <div className="flex border-b border-neutral-100 md:hidden">
      {(["questions", "sheet"] as const).map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`flex-1 border-b-2 py-2.5 text-sm font-medium transition ${
            active === tab ? "border-orange-500 text-neutral-900" : "border-transparent text-neutral-400"
          }`}
        >
          {tab === "questions" ? "Questions" : "Answer Sheet"}
        </button>
      ))}
    </div>
  );
}
