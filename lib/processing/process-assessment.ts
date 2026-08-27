import type { FileInput } from "@/lib/validation/file-validation";
import { extractQuestions } from "@/lib/extraction/extract-questions";
import { extractAnswers } from "@/lib/extraction/extract-answers";
import { mapAnswers } from "@/lib/mapping/map-answers";
import { geminiAnalyzer } from "@/lib/ai/gemini-analyzer";
import { describeCount, stageEvent, type ProcessEvent } from "./stages";
import { toFriendlyMessage } from "./to-friendly-message";

/**
 * The single application-layer workflow. Each extraction/mapping step
 * happens exactly once; every stage is yielded as it starts or completes so
 * the API route can stream real progress instead of blocking on one big
 * response. Any failure becomes a teacher-facing error event — the
 * generator never throws past this boundary.
 */
export async function* processAssessment(files: {
  questionPaper: FileInput;
  answerSheet: FileInput;
}): AsyncGenerator<ProcessEvent> {
  try {
    yield stageEvent("files-uploaded", "Files uploaded");

    yield stageEvent("reading-question-paper", "Reading question paper");
    const { questions, paperTotalMarks } = await extractQuestions(files.questionPaper);
    yield stageEvent("questions-extracted", describeCount(questions.length, "question"));

    yield stageEvent("reading-answer-sheet", "Reading answer sheet");
    const answers = await extractAnswers(files.answerSheet);

    yield stageEvent("mapping-answers", "Mapping answers");
    const mappings = await mapAnswers(questions, answers, geminiAnalyzer);

    yield stageEvent("preparing-results", "Preparing results");
    yield { type: "result", result: { questions, answers, mappings, paperTotalMarks } };
  } catch (err) {
    // Full detail server-side only — the client only ever sees the friendly message.
    console.error("processAssessment failed:", err);
    yield { type: "error", message: toFriendlyMessage(err) };
  }
}
