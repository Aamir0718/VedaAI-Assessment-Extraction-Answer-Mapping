"use client";

import { useRef } from "react";
import { FilePreviewCard } from "./FilePreviewCard";

type Props = { label: string; accept: string; file: File | null; onSelect: (file: File | null) => void };

export function FileDropzone({ label, accept, file, onSelect }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-lg border border-dashed border-neutral-300 p-6 text-center">
      <p className="mb-2 text-sm font-medium text-neutral-700">{label}</p>
      {file ? (
        <FilePreviewCard file={file} onRemove={() => onSelect(null)} />
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-md border px-4 py-2 text-sm hover:bg-neutral-50"
        >
          Upload
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
