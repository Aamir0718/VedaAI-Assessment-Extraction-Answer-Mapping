"use client";

import { useRouter } from "next/navigation";
import { FileQuestion } from "lucide-react";

/** Shown when the teacher lands on /assessment with nothing processed yet this session. */
export function NoResultsState() {
  const router = useRouter();
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <FileQuestion className="size-10 text-ink-400" aria-hidden />
      <p className="text-sm text-ink-500">No assessment results yet.</p>
      <button
        type="button"
        onClick={() => router.push("/")}
        className="text-sm font-medium text-brand-600 underline"
      >
        Upload documents
      </button>
    </main>
  );
}
