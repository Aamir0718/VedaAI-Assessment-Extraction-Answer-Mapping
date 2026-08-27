import { useRouter } from "next/navigation";
import { FileQuestion } from "lucide-react";

/** Shown when the question paper genuinely yielded no questions — not an error, just nothing to show. */
export function EmptyResultsState() {
  const router = useRouter();
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <FileQuestion className="size-10 text-neutral-300" aria-hidden />
      <p className="max-w-sm text-sm text-neutral-500">
        No questions could be found in that question paper. Double-check it&rsquo;s the right file, or
        try a clearer scan.
      </p>
      <button
        type="button"
        onClick={() => router.push("/")}
        className="text-sm font-medium text-orange-600 underline"
      >
        Try another upload
      </button>
    </main>
  );
}
