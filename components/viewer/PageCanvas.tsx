"use client";

import { useState } from "react";
import { Page } from "react-pdf";
import type { AnswerRegion } from "@/types/assessment";
import type { PageSize } from "@/lib/pdf/coordinates";
import { HighlightOverlay } from "./HighlightOverlay";

type Props = { pageNumber: number; regions: AnswerRegion[]; width: number };

/** Renders one PDF page and overlays whichever regions belong to it. */
export function PageCanvas({ pageNumber, regions, width }: Props) {
  const [pageSize, setPageSize] = useState<PageSize | null>(null);

  return (
    <div className="relative inline-block overflow-hidden rounded-control border border-border shadow-sm">
      <Page
        pageNumber={pageNumber}
        width={width}
        renderTextLayer={false}
        renderAnnotationLayer={false}
        onRenderSuccess={(page) => setPageSize({ width: page.width, height: page.height })}
      />
      {pageSize && <HighlightOverlay regions={regions} pageSize={pageSize} />}
    </div>
  );
}
