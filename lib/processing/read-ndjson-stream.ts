/** Reads a newline-delimited JSON response body as it streams in. */
export async function* readNdjsonStream<T>(response: Response): AsyncGenerator<T> {
  if (!response.body) return;

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.trim()) yield JSON.parse(line) as T;
    }
  }

  if (buffer.trim()) yield JSON.parse(buffer) as T;
}
