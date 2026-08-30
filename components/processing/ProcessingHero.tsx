import { Sparkles } from "lucide-react";

export function ProcessingHero() {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="relative flex size-16 items-center justify-center">
        <span className="animate-spin-slow absolute inset-0 rounded-full border-2 border-dashed border-brand-300" />
        <div className="flex size-11 items-center justify-center rounded-panel bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand-100">
          <Sparkles className="size-5 animate-pulse text-white" aria-hidden />
        </div>
      </div>
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-ink-900">
          Processing your assessment
        </h1>
        <p className="mt-1 text-sm text-ink-500">This may take a moment — hang tight.</p>
      </div>
    </div>
  );
}
