import type { ReactNode } from "react";

/** Minimal brand header shared by every screen. */
export function AppHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-neutral-900 text-sm font-bold text-white">
          V
        </span>
        <span className="text-sm font-semibold text-neutral-900">VedaAI</span>
      </div>
      {children}
    </header>
  );
}
