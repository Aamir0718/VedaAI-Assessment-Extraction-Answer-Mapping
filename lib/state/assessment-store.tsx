"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AssessmentResult, Evaluation } from "@/types/assessment";

type AnswerSheetFile = { url: string; mimeType: string };
type StoredState = { result: AssessmentResult | null; answerSheet: AnswerSheetFile | null };

const EMPTY_STATE: StoredState = { result: null, answerSheet: null };
const STORAGE_KEY = "vedaai-assessment-result";

type Store = {
  state: StoredState;
  setResult: (result: AssessmentResult, answerSheet: AnswerSheetFile) => void;
  setEvaluations: (evaluations: Evaluation[]) => void;
};
const AssessmentContext = createContext<Store | null>(null);

/**
 * Holds the current AssessmentResult client-side (no server memory to rely
 * on in a stateless deploy). The answer-sheet blob URL only survives this
 * SPA session; the JSON-serializable result also mirrors into
 * sessionStorage so a refresh keeps the analysis even though the viewer
 * would need a re-upload to show highlights again.
 */
export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoredState>(EMPTY_STATE);

  useEffect(() => {
    // One-time sync from an external system (sessionStorage) on mount —
    // must run post-hydration since the server has no storage to read.
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setState({ result: JSON.parse(raw), answerSheet: null });
    } catch {
      // Ignore — private browsing or corrupted storage just means no rehydration.
    }
  }, []);

  const persist = (result: AssessmentResult) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    } catch {
      // Storage can be full/unavailable — the in-memory state still works for this session.
    }
  };

  const setResult = (result: AssessmentResult, answerSheet: AnswerSheetFile) => {
    setState({ result, answerSheet });
    persist(result);
  };

  const setEvaluations = (evaluations: Evaluation[]) => {
    setState((prev) => {
      if (!prev.result) return prev;
      const result = { ...prev.result, evaluations };
      persist(result);
      return { ...prev, result };
    });
  };

  return (
    <AssessmentContext.Provider value={{ state, setResult, setEvaluations }}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessmentStore(): Store {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error("useAssessmentStore must be used within AssessmentProvider");
  return ctx;
}
