import { rm } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { cacheKey, readCachedResponse, writeCachedResponse } from "@/lib/ai/cache";

const CACHE_DIR = path.join(process.cwd(), ".cache", "gemini");

describe("gemini response cache", () => {
  afterEach(async () => {
    await rm(CACHE_DIR, { recursive: true, force: true });
    delete process.env.GEMINI_CACHE;
  });

  it("misses until something is written for that exact prompt + files", async () => {
    const key = cacheKey("prompt", [Buffer.from("file-bytes")]);
    expect(await readCachedResponse(key)).toBeUndefined();

    await writeCachedResponse(key, '{"ok":true}');
    expect(await readCachedResponse(key)).toBe('{"ok":true}');
  });

  it("gives different keys to different prompts or different file bytes", () => {
    const base = cacheKey("prompt", [Buffer.from("a")]);
    expect(cacheKey("other prompt", [Buffer.from("a")])).not.toBe(base);
    expect(cacheKey("prompt", [Buffer.from("b")])).not.toBe(base);
  });

  it("is a no-op in both directions when GEMINI_CACHE=false", async () => {
    process.env.GEMINI_CACHE = "false";
    const key = cacheKey("disabled-case", []);

    await writeCachedResponse(key, '{"ok":true}');
    expect(await readCachedResponse(key)).toBeUndefined();
  });
});
