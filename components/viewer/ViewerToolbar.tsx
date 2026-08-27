import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";

type Props = {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  page: number;
  totalPages: number | null;
  regionIndex: number | null;
  totalRegions: number;
  onPrevRegion: () => void;
  onNextRegion: () => void;
};

/** Zoom controls + page/region indicators, shared by the PDF and image viewers. */
export function ViewerToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  page,
  totalPages,
  regionIndex,
  totalRegions,
  onPrevRegion,
  onNextRegion,
}: Props) {
  return (
    <div className="flex w-full items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-500">
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={onZoomOut} className="rounded p-1 hover:bg-neutral-100" aria-label="Zoom out">
          <Minus className="size-3.5" aria-hidden />
        </button>
        <span className="w-10 text-center">{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={onZoomIn} className="rounded p-1 hover:bg-neutral-100" aria-label="Zoom in">
          <Plus className="size-3.5" aria-hidden />
        </button>
      </div>
      <span>{totalPages ? `Page ${page} of ${totalPages}` : ""}</span>
      {regionIndex !== null && (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onPrevRegion}
            disabled={regionIndex === 0}
            className="rounded p-1 hover:bg-neutral-100 disabled:opacity-30"
            aria-label="Previous region"
          >
            <ChevronLeft className="size-3.5" aria-hidden />
          </button>
          <span>
            Region {regionIndex + 1} of {totalRegions}
          </span>
          <button
            type="button"
            onClick={onNextRegion}
            disabled={regionIndex === totalRegions - 1}
            className="rounded p-1 hover:bg-neutral-100 disabled:opacity-30"
            aria-label="Next region"
          >
            <ChevronRight className="size-3.5" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
