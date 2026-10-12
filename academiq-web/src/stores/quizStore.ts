import { create } from "zustand";
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

// What callers must provide (sessionId is generated internally)
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

export const useQuizStore = create<QuizState>((set, get) => ({
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

  tick: () => {
    const t = get().timeLeft;
    if (t > 0) set({ timeLeft: t - 1 });
  },

  reset: () =>
    set({
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
    }),
}));