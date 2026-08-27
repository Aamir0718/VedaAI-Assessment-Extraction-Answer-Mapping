import { AiOutputError } from "@/lib/ai/types";

/** Never expose a raw stack trace or provider error string to the teacher. */
export function toFriendlyMessage(err: unknown): string {
  if (err instanceof AiOutputError) {
    return "We couldn't read one of the documents with AI. Please try again in a moment.";
  }
  if (err instanceof Error && /invalid pdf|corrupt|password|encrypted/i.test(err.message)) {
    return "One of the uploaded files appears to be corrupted or unreadable. Please re-upload it.";
  }
  return "Something went wrong while processing these documents. Please try again.";
}
