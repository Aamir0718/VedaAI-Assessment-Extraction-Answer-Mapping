import { Sparkles } from "lucide-react";

/** Circular badge + headline — deliberately not a literal copy of any reference art. */
export function UploadHero() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-orange-50 ring-8 ring-orange-50/70">
        <Sparkles className="size-8 text-orange-500" aria-hidden />
        <span className="absolute -right-1 -top-1 size-3 rounded-full bg-orange-400" />
        <span className="absolute -bottom-1 -left-2 size-2 rounded-full bg-orange-300" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 sm:text-3xl">
          Upload{" "}
          <span className="rounded bg-orange-100 px-1.5 py-0.5 text-orange-700">
            Question Paper &amp; Answer Sheet
          </span>
        </h1>
        <p className="mt-2 text-sm text-neutral-500">Upload both files to get started</p>
      </div>
    </div>
  );
}
