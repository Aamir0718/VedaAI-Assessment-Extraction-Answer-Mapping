import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import type { ZodType } from "zod";
import type { FileInput } from "@/lib/validation/file-validation";
import { cacheKey, readCachedResponse, writeCachedResponse } from "./cache";
import { AiOutputError } from "./types";

const DEFAULT_MODEL = "gemini-3.6-flash";

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AiOutputError("GEMINI_API_KEY is not configured.");
  }
  const client = new GoogleGenerativeAI(apiKey);
  return client.getGenerativeModel({
    model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
    // temperature: 0 so extraction/mapping/grading are reproducible — the
    // same paper and answer should score the same way every time, not
    // sample a different grade on each click of "Grade with AI".
    generationConfig: { responseMimeType: "application/json", temperature: 0 },
  });
}

/** A document is one-or-more parts (a PDF, or several sequential page images) — each becomes its own inline part. */
function toParts(file: FileInput): Part[] {
  return file.parts.map((p) => ({ inlineData: { mimeType: p.mimeType, data: p.buffer.toString("base64") } }));
}

/** Strips accidental markdown code fences before JSON.parse. */
function stripCodeFence(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : text).trim();
}

function parseAndValidate<T>(responseText: string, schema: ZodType<T>): T {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(responseText));
  } catch (err) {
    throw new AiOutputError("Gemini returned non-JSON output.", err);
  }

  const validated = schema.safeParse(parsed);
  if (!validated.success) {
    throw new AiOutputError("Gemini output failed schema validation.", validated.error);
  }
  return validated.data;
}

/**
 * Single call site for every Gemini request: builds the parts array, sends
 * one generateContent call, and validates the JSON response against a Zod
 * schema before returning it. Never returns unvalidated model output.
 *
 * Checks an on-disk cache first, keyed by the exact prompt + file bytes —
 * re-running the same document while iterating locally costs no quota
 * after the first call. A cache entry that no longer validates (e.g. the
 * schema changed since it was written) is treated as a miss, not an error.
 */
export async function generateJson<T>(params: {
  prompt: string;
  files?: FileInput[];
  schema: ZodType<T>;
}): Promise<T> {
  const fileBuffers = (params.files ?? []).flatMap((f) => f.parts.map((p) => p.buffer));
  const key = cacheKey(params.prompt, fileBuffers);

  const cached = await readCachedResponse(key);
  if (cached !== undefined) {
    try {
      return parseAndValidate(cached, params.schema);
    } catch {
      // Fall through and call Gemini for real.
    }
  }

  const parts: Part[] = [{ text: params.prompt }, ...(params.files ?? []).flatMap(toParts)];

  let responseText: string;
  try {
    const result = await getModel().generateContent(parts);
    responseText = result.response.text();
  } catch (err) {
    throw new AiOutputError("Gemini request failed.", err);
  }

  const validated = parseAndValidate(responseText, params.schema);
  await writeCachedResponse(key, responseText);
  return validated;
}
