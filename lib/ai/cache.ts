import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * On-disk cache for raw Gemini responses, keyed by exactly what was sent
 * (prompt + file bytes). Re-running the same document through the same
 * prompt — the common case while iterating on a fix locally — costs zero
 * quota on every run after the first. Set GEMINI_CACHE=false to bypass
 * (e.g. to force a fresh call after a prompt change while testing).
 */
const CACHE_DIR = path.join(process.cwd(), ".cache", "gemini");
const enabled = () => process.env.GEMINI_CACHE !== "false";

export function cacheKey(prompt: string, fileBuffers: Buffer[]): string {
  const hash = createHash("sha256").update(prompt);
  for (const buf of fileBuffers) hash.update(buf);
  return hash.digest("hex");
}

/** Best-effort: a cache miss or a broken cache dir should never fail the real request. */
export async function readCachedResponse(key: string): Promise<string | undefined> {
  if (!enabled()) return undefined;
  try {
    return await readFile(path.join(CACHE_DIR, `${key}.json`), "utf8");
  } catch {
    return undefined;
  }
}

export async function writeCachedResponse(key: string, responseText: string): Promise<void> {
  if (!enabled()) return;
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(path.join(CACHE_DIR, `${key}.json`), responseText, "utf8");
  } catch {
    // Non-fatal — the response was still returned to the caller either way.
  }
}
