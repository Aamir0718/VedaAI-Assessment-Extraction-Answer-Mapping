"use client";

import { useMemo, useState } from "react";
import { Document } from "react-pdf";
import type { AnswerRegion } from "@/types/assessment";
import { pagesForRegions, regionsByPage } from "@/lib/pdf/coordinates";
import { PageCanvas } from "./PageCanvas";
import { ViewerToolbar } from "./ViewerToolbar";
import { useContainerWidth } from "./use-container-width";
import "@/lib/pdf/pdf-worker-setup";

type Props = { fileUrl: string; regions: AnswerRegion[] };

const BASE_WIDTH = 640;
const ZOOM_STEP = 0.15;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;

/**
 * Renders the answer-sheet PDF and, when the selected answer spans more
 * than one page, lets the teacher step through each region in turn.
 */
export function PdfViewer({ fileUrl, regions }: Props) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [regionIndex, setRegionIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const { ref: containerRef, width: containerWidth } = useContainerWidth<HTMLDivElement>();

  const pages = useMemo(() => pagesForRegions(regions), [regions]);
  const byPage = useMemo(() => regionsByPage(regions), [regions]);
  const currentPage = pages[regionIndex] ?? 1;
  const currentRegions = byPage.get(currentPage) ?? [];
  const renderWidth = containerWidth ? Math.min(BASE_WIDTH * zoom, containerWidth) : BASE_WIDTH * zoom;

  return (
    <div ref={containerRef} className="flex w-full flex-col items-center gap-3">
      <ViewerToolbar
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))}
        onZoomOut={() => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP))}
        page={currentPage}
        totalPages={numPages}
        regionIndex={pages.length > 1 ? regionIndex : null}
        totalRegions={pages.length}
        onPrevRegion={() => setRegionIndex((i) => Math.max(0, i - 1))}
        onNextRegion={() => setRegionIndex((i) => Math.min(pages.length - 1, i + 1))}
      />
      <Document
        file={fileUrl}
        onLoadSuccess={(doc) => setNumPages(doc.numPages)}
        loading={<p className="p-8 text-sm text-neutral-400">Loading answer sheet…</p>}
      >
        <PageCanvas pageNumber={currentPage} regions={currentRegions} width={renderWidth} />
      </Document>
    </div>
  );
}
