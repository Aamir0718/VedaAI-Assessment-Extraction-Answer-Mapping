/**
 * pdfjs-dist's "legacy" Node build still touches a few browser-only globals
 * (DOMMatrix, Path2D, ImageData) at module-evaluation time in its
 * canvas-adjacent code, even for a text-only extraction that never renders
 * to a canvas. This never reproduces under plain `node`/Vitest locally
 * (confirmed directly against this exact pdfjs-dist version) — it's a
 * Vercel/Turbopack production-bundling difference: whatever code path
 * Turbopack includes in the deployed serverless function evaluates a
 * reference these stubs never actually need to be *correct*, just present.
 *
 * Import this for its side effect only, and first — before pdfjs-dist —
 * since ES module imports evaluate top-to-bottom in file order.
 */
function stub(name: string) {
  if (typeof (globalThis as Record<string, unknown>)[name] === "undefined") {
    (globalThis as Record<string, unknown>)[name] = class {};
  }
}

for (const name of ["DOMMatrix", "Path2D", "ImageData"]) stub(name);
