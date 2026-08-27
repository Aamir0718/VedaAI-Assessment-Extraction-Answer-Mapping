import { describe, expect, it } from "vitest";
import {
  pagesForRegions,
  regionsByPage,
  regionToPixels,
} from "@/lib/pdf/coordinates";
import type { AnswerRegion } from "@/types/assessment";

describe("regionToPixels", () => {
  it("scales a normalized region by the rendered page size", () => {
    const region: AnswerRegion = { page: 1, x: 0.12, y: 0.35, width: 0.72, height: 0.18 };
    const pixels = regionToPixels(region, { width: 1000, height: 2000 });

    expect(pixels).toEqual({ left: 120, top: 700, width: 720, height: 360 });
  });

  it("produces the full page rect for a region covering (0,0)-(1,1)", () => {
    const region: AnswerRegion = { page: 1, x: 0, y: 0, width: 1, height: 1 };
    expect(regionToPixels(region, { width: 800, height: 600 })).toEqual({
      left: 0,
      top: 0,
      width: 800,
      height: 600,
    });
  });

  it("stays proportionally identical at any resolution", () => {
    const region: AnswerRegion = { page: 1, x: 0.25, y: 0.5, width: 0.5, height: 0.25 };
    const small = regionToPixels(region, { width: 400, height: 400 });
    const large = regionToPixels(region, { width: 800, height: 800 });

    expect(large).toEqual({
      left: small.left * 2,
      top: small.top * 2,
      width: small.width * 2,
      height: small.height * 2,
    });
  });
});

describe("regionsByPage", () => {
  it("groups multi-page regions by their page number", () => {
    const regions: AnswerRegion[] = [
      { page: 3, x: 0, y: 0, width: 0.1, height: 0.1 },
      { page: 4, x: 0, y: 0, width: 0.1, height: 0.1 },
      { page: 3, x: 0.2, y: 0.2, width: 0.1, height: 0.1 },
    ];
    const byPage = regionsByPage(regions);

    expect(byPage.get(3)).toHaveLength(2);
    expect(byPage.get(4)).toHaveLength(1);
    expect(byPage.get(5)).toBeUndefined();
  });
});

describe("pagesForRegions", () => {
  it("returns distinct pages in ascending order regardless of input order", () => {
    const regions: AnswerRegion[] = [
      { page: 5, x: 0, y: 0, width: 0.1, height: 0.1 },
      { page: 3, x: 0, y: 0, width: 0.1, height: 0.1 },
      { page: 5, x: 0, y: 0, width: 0.1, height: 0.1 },
      { page: 4, x: 0, y: 0, width: 0.1, height: 0.1 },
    ];
    expect(pagesForRegions(regions)).toEqual([3, 4, 5]);
  });
});
