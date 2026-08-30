import { ClipboardList, FileCheck2, GraduationCap, Home, Library, Settings, Sparkles } from "lucide-react";

const NAV_ITEMS = [
  { label: "Home", icon: Home, active: false },
  { label: "My Classroom", icon: GraduationCap, active: false },
  { label: "Assignments", icon: ClipboardList, active: false },
  { label: "Exams", icon: FileCheck2, active: true },
  { label: "My Library", icon: Library, active: false },
] as const;

/**
 * Static app-shell chrome — deliberately decorative. This app is a single
 * upload → processing → results flow, not a multi-tenant classroom product,
 * so only "Exams" (what this app actually is) is styled active; the rest are
 * unclickable placeholders that give the shell the reference's look without
 * implying pages that don't exist. Desktop/tablet only — collapses on mobile
 * in favor of the compact header + results tab toggle.
 */
export function Sidebar() {
  return (
    <aside className="hidden w-[248px] shrink-0 flex-col border-r border-border bg-surface p-4 md:flex">
      <div className="flex items-center gap-2.5 px-2 pb-7">
        <span className="flex size-9 items-center justify-center rounded-control bg-gradient-to-br from-ink-900 to-ink-700 text-white shadow-sm">
          <Sparkles className="size-[18px]" aria-hidden />
        </span>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ label, icon: Icon, active }) => (
          <div
            key={label}
            className={`flex items-center gap-3 rounded-control px-3 py-2.5 text-sm ${
              active ? "bg-ink-100 font-semibold text-ink-900" : "font-medium text-ink-500"
            }`}
          >
            <Icon className="size-[18px] shrink-0" aria-hidden />
            {label}
          </div>
        ))}
      </nav>

      <div className="flex-1" />

      <div className="flex items-center gap-3 rounded-control border-t border-border-subtle px-3 pt-4 text-sm font-medium text-ink-500">
        <Settings className="size-[18px] shrink-0" aria-hidden />
        Settings
      </div>
    </aside>
  );
}
