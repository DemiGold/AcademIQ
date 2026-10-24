import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";
import { useQuizStore } from "../../stores/quizStore";
import { submitExamAttempt } from "../../services/examService";
import { classNames } from "../../lib/utils";
import type { Question } from "../../lib/types";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import QuizTopBar from "./components/QuizTopBar";
import QuestionBlock from "./components/QuestionBlock";

export default function QuizPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const sessionId = useQuizStore((s) => s.sessionId);
  const courseId = useQuizStore((s) => s.courseId);
  const courseCode = useQuizStore((s) => s.courseCode);
  const questions = useQuizStore((s) => s.questions);
  const currentIndex = useQuizStore((s) => s.currentIndex);
  const answers = useQuizStore((s) => s.answers);
  const timeLeft = useQuizStore((s) => s.timeLeft);

  const selectAnswer = useQuizStore((s) => s.selectAnswer);
  const setIndex = useQuizStore((s) => s.setIndex);
  const tick = useQuizStore((s) => s.tick);
  const reset = useQuizStore((s) => s.reset);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exitConfirm, setExitConfirm] = useState(false);
  const [submitConfirm, setSubmitConfirm] = useState(false);

  const autoSubmitRef = useRef(false);
  const initialTickDone = useRef(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!sessionId) return;
    tick();
    initialTickDone.current = true;
    const interval = setInterval(() => tick(), 1000);
    return () => clearInterval(interval);
  }, [sessionId, tick]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentIndex]);

  const doSubmit = useCallback(async () => {
    if (!sessionId || !courseId || !courseCode || !questions) return;
    if (submittingRef.current) return;

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);

    const payload = questions.map((q) => ({
      question_id: q.id,
      selected_index: answers[q.id] ?? null,
    }));

    try {
      const attemptId = await submitExamAttempt(sessionId, courseId, payload);
      navigate(`/quiz/${courseCode}/result`, {
        replace: true,
        state: { attemptId, questions, answers },
      });
    } catch (err) {
      setError((err as Error).message);
      submittingRef.current = false;
      setSubmitting(false);
      autoSubmitRef.current = false;
    }
  }, [sessionId, courseId, courseCode, questions, answers, navigate]);

  useEffect(() => {
    if (!initialTickDone.current) return;
    if (timeLeft > 0 || autoSubmitRef.current) return;
    autoSubmitRef.current = true;
    void doSubmit();
  }, [timeLeft, doSubmit]);

  if (!sessionId || !questions || !courseId || !courseCode) {
    return <Navigate to={`/courses/${code}`} replace />;
  }

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;

  const confirmExit = () => {
    reset();
    navigate(`/courses/${code}`, { replace: true });
  };

  const handleExit = () => {
    if (Object.keys(answers).length > 0) {
      setExitConfirm(true);
    } else {
      confirmExit();
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) setIndex(currentIndex + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setIndex(currentIndex - 1);
  };

  const handleManualSubmit = () => {
    if (unansweredCount > 0) {
      setSubmitConfirm(true);
    } else {
      void doSubmit();
    }
  };

  const handleConfirmSubmit = () => {
    setSubmitConfirm(false);
    void doSubmit();
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <QuizTopBar
        courseCode={courseCode}
        current={currentIndex}
        total={questions.length}
        timeLeft={timeLeft}
        onExit={handleExit}
        onSubmit={handleManualSubmit}
        submitting={submitting}
      />

      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-5 pb-24 sm:pb-6">
        <QuickNav
          questions={questions}
          currentIndex={currentIndex}
          answers={answers}
          onJump={setIndex}
        />

        <QuestionBlock
          question={currentQuestion}
          index={currentIndex}
          total={questions.length}
          selectedIndex={answers[currentQuestion.id]}
          onSelect={(i) => selectAnswer(currentQuestion.id, i)}
        />

        {error && (
          <div className="mt-4 rounded-lg border border-brand-danger/30 bg-brand-danger/10 px-4 py-3 text-sm text-brand-danger">
            Failed to submit: {error}
          </div>
        )}
      </div>

      <div className="fixed sm:sticky bottom-0 inset-x-0 z-20 border-t border-bg-border bg-bg-secondary/95 backdrop-blur-md pb-safe">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-3 flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex-1"
          >
            <ChevronLeft size={16} />
            Prev
          </Button>

          <div className="hidden sm:flex items-center gap-1 px-3 text-xs text-text-muted font-semibold">
            {answeredCount} / {questions.length} answered
          </div>

          {currentIndex < questions.length - 1 ? (
            <Button onClick={handleNext} className="flex-1">
              Next
              <ChevronRight size={16} />
            </Button>
          ) : (
            <Button
              onClick={handleManualSubmit}
              disabled={submitting}
              className="flex-1"
            >
              <Send size={16} />
              Submit
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={submitConfirm}
        title="Submit with unanswered questions?"
        message={`You have ${unansweredCount} unanswered ${
          unansweredCount === 1 ? "question" : "questions"
        }. They will be marked as wrong. You can still come back and answer them before submitting.`}
        confirmLabel="Submit anyway"
        cancelLabel="Keep practicing"
        tone="danger"
        loading={submitting}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setSubmitConfirm(false)}
      />

      <ConfirmDialog
        open={exitConfirm}
        title="Exit without submitting?"
        message="Your answers for this session will be discarded. This can't be undone."
        confirmLabel="Exit anyway"
        cancelLabel="Keep practicing"
        tone="danger"
        onConfirm={confirmExit}
        onCancel={() => setExitConfirm(false)}
      />
    </div>
  );
}

function QuickNav({
  questions,
  currentIndex,
  answers,
  onJump,
}: {
  questions: Question[];
  currentIndex: number;
  answers: Record<string, number>;
  onJump: (index: number) => void;
}) {
  return (
    <div className="rounded-xl border border-bg-border bg-bg-secondary p-3 mb-4">
      <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">
        Quick Navigation
      </div>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
        {questions.map((q, i) => {
          const isCurrent = i === currentIndex;
          const isAnswered = answers[q.id] !== undefined;

          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onJump(i)}
              className={classNames(
                "shrink-0 w-9 h-9 rounded-full border text-xs font-bold transition",
                isCurrent
                  ? "bg-brand-primary border-brand-primary text-white"
                  : isAnswered
                  ? "bg-brand-success/15 border-brand-success/50 text-brand-success hover:border-brand-success"
                  : "bg-bg-tertiary border-bg-border text-text-muted hover:border-brand-primary/40"
              )}
              aria-label={`Jump to question ${i + 1}${isAnswered ? " (answered)" : ""}`}
              aria-current={isCurrent ? "step" : undefined}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
