"use client";

import { useMemo, useState } from "react";
import type { AnswerRegion } from "@/types/assessment";
import { pagesForRegions, regionsByPage } from "@/lib/pdf/coordinates";
import { HighlightOverlay } from "./HighlightOverlay";
import { ViewerToolbar } from "./ViewerToolbar";
import { useContainerWidth } from "./use-container-width";

type Props = { imageUrls: string[]; regions: AnswerRegion[] };

const BASE_WIDTH = 640;
const ZOOM_STEP = 0.15;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;

/**
 * One image per page — a single-page answer sheet is just the one-image
 * case of this. Steps through region-bearing pages the same way PdfViewer
 * does, since both are ultimately "one page per index" viewers.
 */
export function ImageViewer({ imageUrls, regions }: Props) {
  // Derived from the current image's natural size, not measured after each
  // zoom change — <img onLoad> only fires once, so re-measuring would go stale.
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [regionIndex, setRegionIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const { ref: containerRef, width: containerWidth } = useContainerWidth<HTMLDivElement>();

  const pages = useMemo(() => pagesForRegions(regions), [regions]);
  const byPage = useMemo(() => regionsByPage(regions), [regions]);
  const currentPage = pages[regionIndex] ?? 1;
  const currentRegions = byPage.get(currentPage) ?? [];

  const width = containerWidth ? Math.min(BASE_WIDTH * zoom, containerWidth) : BASE_WIDTH * zoom;
  const pageSize = aspectRatio ? { width, height: width / aspectRatio } : null;

  return (
    <div ref={containerRef} className="flex w-full flex-col items-center gap-3">
      <ViewerToolbar
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))}
        onZoomOut={() => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP))}
        page={currentPage}
        totalPages={imageUrls.length}
        regionIndex={pages.length > 1 ? regionIndex : null}
        totalRegions={pages.length}
        onPrevRegion={() => setRegionIndex((i) => Math.max(0, i - 1))}
        onNextRegion={() => setRegionIndex((i) => Math.min(pages.length - 1, i + 1))}
      />
      <div
        className="relative inline-block overflow-hidden rounded-control border border-border shadow-sm"
        style={{ width }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- dynamic client-side blob URL */}
        <img
          key={currentPage}
          src={imageUrls[currentPage - 1]}
          alt={`Answer sheet page ${currentPage}`}
          className="block w-full"
          onLoad={(e) => setAspectRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
        />
        {pageSize && <HighlightOverlay regions={currentRegions} pageSize={pageSize} />}
      </div>
    </div>
  );
}
