import type { AnswerRegion } from "@/types/assessment";
import { PdfViewer } from "./PdfViewer";
import { ImageViewer } from "./ImageViewer";

type Props = { file: { url: string; mimeType: string }; regions: AnswerRegion[] };

/** Picks the right renderer for the uploaded answer sheet's file type. */
export function AnswerSheetViewer({ file, regions }: Props) {
  if (file.mimeType === "application/pdf") {
    return <PdfViewer fileUrl={file.url} regions={regions} />;
  }
  return <ImageViewer imageUrl={file.url} regions={regions} />;
}
