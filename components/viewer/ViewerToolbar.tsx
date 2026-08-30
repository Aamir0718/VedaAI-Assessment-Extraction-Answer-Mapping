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
    <div className="flex w-full items-center justify-between rounded-control border border-border bg-surface px-3 py-1.5 text-xs text-ink-500">
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={onZoomOut} className="rounded-chip p-1 transition-colors hover:bg-brand-100 hover:text-brand-600 active:scale-90" aria-label="Zoom out">
          <Minus className="size-3.5" aria-hidden />
        </button>
        <span className="w-10 text-center">{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={onZoomIn} className="rounded-chip p-1 transition-colors hover:bg-brand-100 hover:text-brand-600 active:scale-90" aria-label="Zoom in">
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
            className="rounded-chip p-1 transition-colors hover:bg-brand-100 hover:text-brand-600 active:scale-90 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit"
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
            className="rounded-chip p-1 transition-colors hover:bg-brand-100 hover:text-brand-600 active:scale-90 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit"
            aria-label="Next region"
          >
            <ChevronRight className="size-3.5" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
