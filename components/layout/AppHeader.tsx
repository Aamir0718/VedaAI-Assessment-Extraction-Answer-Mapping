import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

/** Minimal header shared by every screen — an icon mark, no product name. */
export function AppHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
      <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-neutral-900 to-neutral-700 text-white shadow-sm">
        <Sparkles className="size-4" aria-hidden />
      </span>
      {children}
    </header>
  );
}
