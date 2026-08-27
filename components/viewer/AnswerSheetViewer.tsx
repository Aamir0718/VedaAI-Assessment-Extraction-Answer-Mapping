"use client";

import dynamic from "next/dynamic";
import type { AnswerRegion } from "@/types/assessment";
import { ImageViewer } from "./ImageViewer";

// pdfjs-dist's browser build only runs in a browser (canvas rendering) —
// disabling SSR here avoids importing it on the server at all.
const PdfViewer = dynamic(() => import("./PdfViewer").then((m) => m.PdfViewer), { ssr: false });

type Props = { file: { urls: string[]; mimeType: string }; regions: AnswerRegion[] };

/** Picks the right renderer for the uploaded answer sheet's file type. */
export function AnswerSheetViewer({ file, regions }: Props) {
  if (file.mimeType === "application/pdf") {
    return <PdfViewer fileUrl={file.urls[0]} regions={regions} />;
  }
  return <ImageViewer imageUrls={file.urls} regions={regions} />;
}
