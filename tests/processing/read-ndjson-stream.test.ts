import { describe, expect, it } from "vitest";
import { readNdjsonStream } from "@/lib/processing/read-ndjson-stream";

function responseFromLines(...lines: string[]): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      for (const line of lines) controller.enqueue(encoder.encode(line));
      controller.close();
    },
  });
  return new Response(body);
}

describe("readNdjsonStream", () => {
  it("parses one JSON object per line", async () => {
    const response = responseFromLines('{"a":1}\n{"a":2}\n{"a":3}\n');
    const events: { a: number }[] = [];
    for await (const event of readNdjsonStream<{ a: number }>(response)) events.push(event);

    expect(events).toEqual([{ a: 1 }, { a: 2 }, { a: 3 }]);
  });

  it("handles a JSON object split across multiple chunks", async () => {
    const response = responseFromLines('{"a":', "1}\n");
    const events: { a: number }[] = [];
    for await (const event of readNdjsonStream<{ a: number }>(response)) events.push(event);

    expect(events).toEqual([{ a: 1 }]);
  });

  it("parses a final line with no trailing newline", async () => {
    const response = responseFromLines('{"a":1}');
    const events: { a: number }[] = [];
    for await (const event of readNdjsonStream<{ a: number }>(response)) events.push(event);

    expect(events).toEqual([{ a: 1 }]);
  });

  it("yields nothing for a response with no body", async () => {
    const response = new Response(null);
    const events: unknown[] = [];
    for await (const event of readNdjsonStream(response)) events.push(event);

    expect(events).toEqual([]);
  });
});
