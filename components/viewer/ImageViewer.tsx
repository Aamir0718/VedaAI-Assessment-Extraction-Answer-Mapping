"use client";

import { useState } from "react";
import type { AnswerRegion } from "@/types/assessment";
import { HighlightOverlay } from "./HighlightOverlay";
import { ViewerToolbar } from "./ViewerToolbar";

type Props = { imageUrl: string; regions: AnswerRegion[] };

const BASE_WIDTH = 640;
const ZOOM_STEP = 0.15;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;

/** A single-image answer sheet is treated as one page (page 1). */
export function ImageViewer({ imageUrl, regions }: Props) {
  // Derived from the image's natural size, not measured after each zoom
  // change — <img onLoad> only fires once, so re-measuring would go stale.
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);

  const width = BASE_WIDTH * zoom;
  const pageSize = aspectRatio ? { width, height: width / aspectRatio } : null;

  return (
    <div className="flex flex-col items-center gap-3">
      <ViewerToolbar
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))}
        onZoomOut={() => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP))}
        page={1}
        totalPages={1}
        regionIndex={null}
        totalRegions={0}
        onPrevRegion={() => {}}
        onNextRegion={() => {}}
      />
      <div
        className="relative inline-block overflow-hidden rounded-lg border border-neutral-200 shadow-sm"
        style={{ width }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- dynamic client-side blob URL */}
        <img
          src={imageUrl}
          alt="Answer sheet"
          className="block w-full"
          onLoad={(e) => setAspectRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
        />
        {pageSize && <HighlightOverlay regions={regions.filter((r) => r.page === 1)} pageSize={pageSize} />}
      </div>
    </div>
  );
}
