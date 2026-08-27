import type { AnswerRegion } from "@/types/assessment";
import { regionToPixels, type PageSize } from "@/lib/pdf/coordinates";

type Props = { regions: AnswerRegion[]; pageSize: PageSize };

/** Draws one highlight rectangle per region, already scaled to the rendered page. */
export function HighlightOverlay({ regions, pageSize }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {regions.map((region, index) => {
        const rect = regionToPixels(region, pageSize);
        return (
          <div
            key={index}
            className="absolute rounded-sm border-2 border-amber-400 bg-amber-300/30"
            style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
          />
        );
      })}
    </div>
  );
}
