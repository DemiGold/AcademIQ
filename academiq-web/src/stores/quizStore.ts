import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { generateUUID } from "../lib/utils";
import type { Question } from "../lib/types";

interface QuizConfig {
  sessionId: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  topicId: string | null;
  topicName: string | null;
  questions: Question[];
  startedAt: number;
  durationSeconds: number;
}

type StartQuizInput = Omit<QuizConfig, "sessionId">;

interface QuizState extends Partial<QuizConfig> {
  currentIndex: number;
  answers: Record<string, number>;
  timeLeft: number;

  startQuiz: (config: StartQuizInput) => void;
  selectAnswer: (questionId: string, optionIndex: number) => void;
  setIndex: (index: number) => void;
  tick: () => void;
  reset: () => void;
}

const EMPTY_STATE = {
  sessionId: undefined,
  courseId: undefined,
  courseCode: undefined,
  courseName: undefined,
  topicId: undefined,
  topicName: undefined,
  questions: undefined,
  startedAt: undefined,
  durationSeconds: undefined,
  currentIndex: 0,
  answers: {},
  timeLeft: 0,
};

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      ...EMPTY_STATE,

      startQuiz: (config) =>
        set({
          ...config,
          sessionId: generateUUID(),
          currentIndex: 0,
          answers: {},
          timeLeft: config.durationSeconds,
        }),

      selectAnswer: (questionId, optionIndex) => {
        const answers = get().answers;
        set({ answers: { ...answers, [questionId]: optionIndex } });
      },

      setIndex: (index) => {
        const qs = get().questions;
        if (!qs) return;
        const clamped = Math.max(0, Math.min(qs.length - 1, index));
        set({ currentIndex: clamped });
      },

      // Wall-clock tick: recomputes remaining seconds from startedAt.
      // Immune to browser background-tab throttling.
      tick: () => {
        const { startedAt, durationSeconds, timeLeft } = get();
        if (!startedAt || !durationSeconds) return;
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        const remaining = Math.max(0, durationSeconds - elapsed);
        if (remaining !== timeLeft) set({ timeLeft: remaining });
      },

      reset: () => set(EMPTY_STATE),
    }),
    {
      name: "academiq-quiz",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
