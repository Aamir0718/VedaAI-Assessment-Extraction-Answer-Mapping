import { Sparkles } from "lucide-react";

export function ProcessingHero() {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="relative flex size-16 items-center justify-center">
        <span className="animate-spin-slow absolute inset-0 rounded-full border-2 border-dashed border-orange-200" />
        <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-amber-300 shadow-lg shadow-orange-200/60">
          <Sparkles className="size-5 animate-pulse text-white" aria-hidden />
        </div>
      </div>
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-neutral-900">
          Processing your assessment
        </h1>
        <p className="mt-1 text-sm text-neutral-500">This may take a moment — hang tight.</p>
      </div>
    </div>
  );
}
