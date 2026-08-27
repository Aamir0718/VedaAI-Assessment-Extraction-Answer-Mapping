"use client";

import { useState } from "react";
import type { AnswerRegion } from "@/types/assessment";
import type { PageSize } from "@/lib/pdf/coordinates";
import { HighlightOverlay } from "./HighlightOverlay";

type Props = { imageUrl: string; regions: AnswerRegion[] };

/** A single-image answer sheet is treated as one page (page 1). */
export function ImageViewer({ imageUrl, regions }: Props) {
  const [pageSize, setPageSize] = useState<PageSize | null>(null);

  return (
    <div className="relative inline-block shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element -- dynamic client-side blob URL */}
      <img
        src={imageUrl}
        alt="Answer sheet"
        className="max-w-full"
        onLoad={(e) => {
          const img = e.currentTarget;
          setPageSize({ width: img.clientWidth, height: img.clientHeight });
        }}
      />
      {pageSize && <HighlightOverlay regions={regions.filter((r) => r.page === 1)} pageSize={pageSize} />}
    </div>
  );
}
