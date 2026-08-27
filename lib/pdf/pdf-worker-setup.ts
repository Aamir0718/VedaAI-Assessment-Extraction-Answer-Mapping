import { pdfjs } from "react-pdf";

// pdfjs-dist's browser build calls the `URL.parse` static method, only
// added to browsers in mid-2024 (Chrome 126+) — polyfill it so rendering
// doesn't silently break for anyone on an older browser.
if (typeof URL.parse !== "function") {
  (URL as typeof URL & { parse: (url: string, base?: string) => URL | null }).parse = (
    url,
    base
  ) => {
    try {
      return new URL(url, base);
    } catch {
      return null;
    }
  };
}

// react-pdf needs an explicit worker URL in a Next.js bundle. Resolving it
// via `new URL(...)` (rather than a CDN string) keeps the version pinned to
// whatever pdfjs-dist react-pdf actually ships, so library and worker can
// never drift apart.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();
