import type { AnswerRegion } from "@/types/assessment";

export type PageSize = { width: number; height: number };
export type PixelRect = { left: number; top: number; width: number; height: number };

/**
 * Converts a normalized (0–1) region to pixel coordinates for a page
 * rendered at the given size. The only place this math happens — kept out
 * of every React component per the architecture.
 */
export function regionToPixels(region: AnswerRegion, pageSize: PageSize): PixelRect {
  return {
    left: region.x * pageSize.width,
    top: region.y * pageSize.height,
    width: region.width * pageSize.width,
    height: region.height * pageSize.height,
  };
}

/** Groups an answer's regions by page number, preserving their given order within each page. */
export function regionsByPage(regions: AnswerRegion[]): Map<number, AnswerRegion[]> {
  const byPage = new Map<number, AnswerRegion[]>();
  for (const region of regions) {
    byPage.set(region.page, [...(byPage.get(region.page) ?? []), region]);
  }
  return byPage;
}

/** Distinct pages touched by a set of regions, in ascending page order. */
export function pagesForRegions(regions: AnswerRegion[]): number[] {
  return [...new Set(regions.map((r) => r.page))].sort((a, b) => a - b);
}
