"use client";

import { useMemo, useState } from "react";
import { Document } from "react-pdf";
import type { AnswerRegion } from "@/types/assessment";
import { pagesForRegions, regionsByPage } from "@/lib/pdf/coordinates";
import { PageCanvas } from "./PageCanvas";
import "./pdf-worker-setup";

type Props = { fileUrl: string; regions: AnswerRegion[] };

/**
 * Renders the answer-sheet PDF and, when the selected answer spans more
 * than one page, lets the teacher step through each region in turn.
 */
export function PdfViewer({ fileUrl, regions }: Props) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [regionIndex, setRegionIndex] = useState(0);

  const pages = useMemo(() => pagesForRegions(regions), [regions]);
  const byPage = useMemo(() => regionsByPage(regions), [regions]);
  const currentPage = pages[regionIndex] ?? 1;
  const currentRegions = byPage.get(currentPage) ?? [];

  return (
    <div className="flex flex-col items-center gap-3">
      {pages.length > 1 && (
        <div className="flex items-center gap-3 text-sm text-neutral-600">
          <button
            onClick={() => setRegionIndex((i) => Math.max(0, i - 1))}
            disabled={regionIndex === 0}
            className="rounded border px-2 py-1 disabled:opacity-40"
          >
            Previous region
          </button>
          <span>
            Region {regionIndex + 1} of {pages.length} — page {currentPage}
          </span>
          <button
            onClick={() => setRegionIndex((i) => Math.min(pages.length - 1, i + 1))}
            disabled={regionIndex === pages.length - 1}
            className="rounded border px-2 py-1 disabled:opacity-40"
          >
            Next region
          </button>
        </div>
      )}
      <Document
        file={fileUrl}
        onLoadSuccess={(doc) => setNumPages(doc.numPages)}
        loading={<p className="p-8 text-sm text-neutral-400">Loading answer sheet…</p>}
      >
        <PageCanvas pageNumber={currentPage} regions={currentRegions} />
      </Document>
      {numPages && (
        <p className="text-xs text-neutral-400">
          Page {currentPage} of {numPages}
        </p>
      )}
    </div>
  );
}
