"use client";

import { useRef, useState, type DragEvent } from "react";
import { Upload } from "lucide-react";
import { FilePreviewCard } from "./FilePreviewCard";
import { DEFAULT_MAX_FILE_SIZE_MB, validateFileMeta } from "@/lib/validation/file-validation";

type Props = { noun: string; accept: string; file: File | null; onSelect: (file: File | null) => void };

/** A drag-and-drop-capable upload target that becomes a file preview once one is chosen. */
export function FileDropzone({ noun, accept, file, onSelect }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(next: File | null) {
    if (!next) {
      onSelect(null);
      setPageCount(null);
      setError(null);
      return;
    }

    // Instant feedback — the server still re-validates authoritatively.
    const check = validateFileMeta(next);
    if (!check.valid) {
      setError(check.error);
      return;
    }

    setError(null);
    onSelect(next);
    // Dynamically imported so pdfjs is never pulled into the server render
    // pass — it's genuinely only ever needed after a browser file-pick.
    const { countPdfPages } = await import("@/lib/pdf/count-pdf-pages");
    setPageCount(await countPdfPages(next));
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }

  if (file) {
    return <FilePreviewCard file={file} pageCount={pageCount} onRemove={() => handleFile(null)} />;
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        className={`group flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-7 text-center transition-all duration-200 active:scale-[0.98] ${
          isDragging
            ? "scale-[1.02] border-orange-400 bg-orange-50 shadow-lg shadow-orange-100"
            : error
              ? "border-red-200"
              : "border-neutral-200 hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50/40 hover:shadow-md"
        }`}
      >
        <span className="flex size-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 transition-transform duration-200 group-hover:scale-110 group-hover:bg-orange-100 group-hover:text-orange-600">
          <Upload className="size-5" aria-hidden />
        </span>
        <p className="text-sm font-medium text-neutral-800">
          Upload <span className="text-orange-600">{noun}</span>
        </p>
        <p className="text-xs text-neutral-400">Max {DEFAULT_MAX_FILE_SIZE_MB}MB</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
      </div>
      {error && <p className="mt-1.5 px-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
