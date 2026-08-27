"use client";

import { useState } from "react";
import { Page } from "react-pdf";
import type { AnswerRegion } from "@/types/assessment";
import type { PageSize } from "@/lib/pdf/coordinates";
import { HighlightOverlay } from "./HighlightOverlay";

type Props = { pageNumber: number; regions: AnswerRegion[] };

/** Renders one PDF page and overlays whichever regions belong to it. */
export function PageCanvas({ pageNumber, regions }: Props) {
  const [pageSize, setPageSize] = useState<PageSize | null>(null);

  return (
    <div className="relative inline-block shadow-sm">
      <Page
        pageNumber={pageNumber}
        width={720}
        renderTextLayer={false}
        renderAnnotationLayer={false}
        onRenderSuccess={(page) => setPageSize({ width: page.width, height: page.height })}
      />
      {pageSize && <HighlightOverlay regions={regions} pageSize={pageSize} />}
    </div>
  );
}
