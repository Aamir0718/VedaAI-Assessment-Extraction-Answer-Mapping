import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import type { ZodType } from "zod";
import type { FileInput } from "@/lib/validation/file-validation";
import { AiOutputError } from "./types";

const DEFAULT_MODEL = "gemini-2.5-flash";

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AiOutputError("GEMINI_API_KEY is not configured.");
  }
  const client = new GoogleGenerativeAI(apiKey);
  return client.getGenerativeModel({
    model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
    generationConfig: { responseMimeType: "application/json" },
  });
}

function toPart(file: FileInput): Part {
  return { inlineData: { mimeType: file.mimeType, data: file.buffer.toString("base64") } };
}

/** Strips accidental markdown code fences before JSON.parse. */
function stripCodeFence(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : text).trim();
}

/**
 * Single call site for every Gemini request: builds the parts array, sends
 * one generateContent call, and validates the JSON response against a Zod
 * schema before returning it. Never returns unvalidated model output.
 */
export async function generateJson<T>(params: {
  prompt: string;
  files?: FileInput[];
  schema: ZodType<T>;
}): Promise<T> {
  const parts: Part[] = [{ text: params.prompt }, ...(params.files ?? []).map(toPart)];

  let responseText: string;
  try {
    const result = await getModel().generateContent(parts);
    responseText = result.response.text();
  } catch (err) {
    throw new AiOutputError("Gemini request failed.", err);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(responseText));
  } catch (err) {
    throw new AiOutputError("Gemini returned non-JSON output.", err);
  }

  const validated = params.schema.safeParse(parsed);
  if (!validated.success) {
    throw new AiOutputError("Gemini output failed schema validation.", validated.error);
  }
  return validated.data;
}
