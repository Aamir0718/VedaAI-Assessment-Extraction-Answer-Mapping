"use client";

import { useRef, useState, type DragEvent } from "react";
import { Upload } from "lucide-react";
import { FilePreviewCard } from "./FilePreviewCard";
import { MultiFilePreview } from "./MultiFilePreview";
import { DEFAULT_MAX_FILE_SIZE_MB, validateFileMeta } from "@/lib/validation/file-validation";

type Props = { noun: string; accept: string; files: File[]; onSelect: (files: File[]) => void };

/**
 * A drag-and-drop-capable upload target. Accepts either one PDF or
 * one-or-more images (several photographed pages of the same document) —
 * never a PDF mixed with anything else.
 */
export function FileDropzone({ noun, accept, files, onSelect }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(selected: File[]) {
    if (selected.length === 0) {
      onSelect([]);
      setPageCount(null);
      setError(null);
      return;
    }

    if (selected.length > 1 && selected.some((f) => f.type === "application/pdf")) {
      setError("A PDF must be uploaded on its own — select multiple files only when they're all images.");
      return;
    }

    for (const file of selected) {
      const check = validateFileMeta(file);
      if (!check.valid) {
        setError(check.error);
        return;
      }
    }

    setError(null);
    onSelect(selected);

    if (selected.length === 1 && selected[0].type === "application/pdf") {
      // Dynamically imported so pdfjs is never pulled into the server render
      // pass — it's genuinely only ever needed after a browser file-pick.
      const { countPdfPages } = await import("@/lib/pdf/count-pdf-pages");
      setPageCount(await countPdfPages(selected[0]));
    } else {
      setPageCount(null);
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) handleFiles(Array.from(e.dataTransfer.files));
  }

  const hiddenInput = (
    <input
      ref={inputRef}
      type="file"
      accept={accept}
      multiple
      className="hidden"
      onChange={(e) => handleFiles(Array.from(e.target.files ?? []))}
    />
  );

  if (files.length === 1) {
    return (
      <div>
        <FilePreviewCard file={files[0]} pageCount={pageCount} onRemove={() => handleFiles([])} />
        {hiddenInput}
      </div>
    );
  }
  if (files.length > 1) {
    return (
      <div>
        <MultiFilePreview
          files={files}
          onRemove={(index) => handleFiles(files.filter((_, i) => i !== index))}
          onReselect={() => inputRef.current?.click()}
        />
        {hiddenInput}
      </div>
    );
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
        className={`group flex cursor-pointer flex-col items-center gap-2 rounded-card border-2 border-dashed px-4 py-7 text-center transition-all duration-200 active:scale-[0.98] ${
          isDragging
            ? "scale-[1.02] border-brand-500 bg-brand-50 shadow-lg shadow-brand-100"
            : error
              ? "border-danger-500"
              : "border-border-subtle bg-surface hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50/40 hover:shadow-md"
        }`}
      >
        <span className="flex size-10 items-center justify-center rounded-control bg-ink-100 text-ink-500 transition-transform duration-200 group-hover:scale-110 group-hover:bg-brand-100 group-hover:text-brand-600">
          <Upload className="size-5" aria-hidden />
        </span>
        <p className="text-sm font-medium text-ink-800">
          Upload <span className="text-brand-600">{noun}</span>
        </p>
        <p className="text-xs text-ink-400">PDF, or multiple images · Max {DEFAULT_MAX_FILE_SIZE_MB}MB</p>
        {hiddenInput}
      </div>
      {error && <p className="mt-1.5 px-1 text-xs text-danger-600">{error}</p>}
    </div>
  );
}
