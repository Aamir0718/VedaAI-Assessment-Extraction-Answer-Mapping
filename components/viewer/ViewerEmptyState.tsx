import { FileQuestion } from "lucide-react";

export function ViewerEmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
      <FileQuestion className="size-8 text-neutral-300" aria-hidden />
      <p className="max-w-xs text-sm text-neutral-400">{message}</p>
    </div>
  );
}
