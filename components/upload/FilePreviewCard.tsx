type Props = { file: File; onRemove: () => void };

function formatSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilePreviewCard({ file, onRemove }: Props) {
  return (
    <div className="flex items-center justify-between rounded-md bg-neutral-50 px-3 py-2 text-sm">
      <div className="truncate text-left">
        <p className="truncate font-medium">{file.name}</p>
        <p className="text-xs text-neutral-500">{formatSize(file.size)}</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="ml-3 shrink-0 text-xs text-neutral-500 hover:text-red-600"
      >
        Remove
      </button>
    </div>
  );
}
