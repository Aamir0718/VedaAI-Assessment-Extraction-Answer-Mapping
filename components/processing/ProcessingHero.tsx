import { Sparkles } from "lucide-react";

export function ProcessingHero() {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="relative flex size-14 items-center justify-center rounded-2xl bg-orange-50">
        <Sparkles className="size-7 animate-pulse text-orange-500" aria-hidden />
      </div>
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Processing your assessment</h1>
        <p className="mt-1 text-sm text-neutral-500">This may take a moment — hang tight.</p>
      </div>
    </div>
  );
}
