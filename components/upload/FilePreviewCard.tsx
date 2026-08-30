import { FileText, X } from "lucide-react";

type Props = { file: File; pageCount: number | null; onRemove: () => void };

function formatSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilePreviewCard({ file, pageCount, onRemove }: Props) {
  const detail = pageCount ? `${formatSize(file.size)} • ${pageCount} page${pageCount === 1 ? "" : "s"}` : formatSize(file.size);

  return (
    <div className="animate-fade-up group relative flex items-center gap-3 rounded-card border border-border bg-surface px-3 py-2.5 text-left shadow-sm transition-shadow hover:shadow-md">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-brand-100 text-brand-600">
        <FileText className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink-800">{file.name}</p>
        <p className="text-xs text-ink-500">{detail}</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
        className="flex size-6 shrink-0 items-center justify-center rounded-pill bg-ink-100 text-ink-500 transition hover:bg-ink-900 hover:text-white"
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
