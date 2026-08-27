import { Sparkles } from "lucide-react";

/** Circular badge + headline — a spinning ring and a gradient mark for a bit of life. */
export function UploadHero() {
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <div className="relative flex size-20 items-center justify-center">
        <span className="animate-spin-slow absolute inset-0 rounded-full border-2 border-dashed border-orange-200" />
        <div className="animate-float-slow flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-300 shadow-lg shadow-orange-200/60">
          <Sparkles className="size-6 text-white" aria-hidden />
        </div>
      </div>
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
          Upload your{" "}
          <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
            question paper &amp; answers
          </span>
        </h1>
        <p className="mt-2 text-sm text-neutral-500">Drop both files below to get started</p>
      </div>
    </div>
  );
}
