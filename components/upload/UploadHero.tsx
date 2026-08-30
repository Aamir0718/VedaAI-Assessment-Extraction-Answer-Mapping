import { Sparkles } from "lucide-react";

/** Circular badge + headline — a spinning ring and a gradient mark for a bit of life. */
export function UploadHero() {
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <div className="relative flex size-20 items-center justify-center">
        <span className="animate-spin-slow absolute inset-0 rounded-full border-2 border-dashed border-brand-300" />
        <div className="animate-float-slow flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand-100">
          <Sparkles className="size-6 text-white" aria-hidden />
        </div>
      </div>
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          Upload your <span className="text-brand-600">question paper &amp; answers</span>
        </h1>
        <p className="mt-2 text-sm text-ink-500">Drop both files below to get started</p>
      </div>
    </div>
  );
}
