import { FileImage, X } from "lucide-react";

type Props = { files: File[]; onRemove: (index: number) => void; onReselect: () => void };

function formatSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Several image files selected as one document's pages, in order. */
export function MultiFilePreview({ files, onRemove, onReselect }: Props) {
  return (
    <div className="animate-fade-up space-y-2 rounded-card border border-border bg-surface p-2.5 shadow-sm">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-medium text-ink-500">{files.length} images selected</p>
        <button type="button" onClick={onReselect} className="text-xs font-medium text-brand-600 hover:underline">
          Change
        </button>
      </div>
      <div className="max-h-40 space-y-1.5 overflow-y-auto">
        {files.map((file, index) => (
          <div
            key={`${file.name}-${file.size}-${index}`}
            className="flex items-center gap-2 rounded-control bg-ink-100 px-2 py-1.5 text-xs"
          >
            <span className="flex size-5 shrink-0 items-center justify-center rounded-chip bg-brand-100 text-brand-600">
              <FileImage className="size-3" aria-hidden />
            </span>
            <span className="min-w-0 flex-1 truncate text-ink-700">
              Page {index + 1} · {file.name}
            </span>
            <span className="shrink-0 text-ink-400">{formatSize(file.size)}</span>
            <button
              type="button"
              onClick={() => onRemove(index)}
              aria-label={`Remove ${file.name}`}
              className="shrink-0 text-ink-400 hover:text-danger-600"
            >
              <X className="size-3" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
