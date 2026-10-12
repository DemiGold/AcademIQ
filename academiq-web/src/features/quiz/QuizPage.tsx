import { useEffect, useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";
import { useQuizStore } from "../../stores/quizStore";
import { submitExamAttempt } from "../../services/examService";
import Button from "../../components/ui/Button";
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

  // Handle missing session (e.g., user refreshed the page)
  if (!sessionId || !questions || !courseId || !courseCode) {
    return <Navigate to={`/courses/${code}`} replace />;
  }

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  // Tick the timer
  useEffect(() => {
    if (timeLeft <= 0) {
      void handleAutoSubmit();
      return;
    }
    const interval = setInterval(() => tick(), 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  // Warn before browser close
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const handleExit = () => {
    if (Object.keys(answers).length > 0) {
      setExitConfirm(true);
    } else {
      confirmExit();
    }
  };

  const confirmExit = () => {
    reset();
    navigate(`/courses/${code}`, { replace: true });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) setIndex(currentIndex + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setIndex(currentIndex - 1);
  };

  const buildPayload = () => {
    return questions.map((q) => ({
      question_id: q.id,
      selected_index: answers[q.id] ?? null,
    }));
  };

  const doSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const attemptId = await submitExamAttempt(
        sessionId,
        courseId,
        buildPayload()
      );
      navigate(`/quiz/${courseCode}/result`, {
        replace: true,
        state: { attemptId, questions, answers },
      });
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  };

  const handleManualSubmit = () => {
    const unanswered = questions.length - Object.keys(answers).length;
    if (unanswered > 0) {
      if (
        !window.confirm(
          `You have ${unanswered} unanswered ${
            unanswered === 1 ? "question" : "questions"
          }. Submit anyway?`
        )
      )
        return;
    }
    void doSubmit();
  };

  const handleAutoSubmit = async () => {
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

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-5 pb-24 sm:pb-6">
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

      {/* Bottom nav — sticky on mobile */}
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

      {/* Exit confirm modal */}
      {exitConfirm && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setExitConfirm(false)}
        >
          <div
            className="bg-bg-secondary w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6 border-t sm:border border-bg-border"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-text-primary mb-2">
              Exit without submitting?
            </h3>
            <p className="text-sm text-text-secondary mb-5">
              Your answers for this session will be discarded. This can't be
              undone.
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setExitConfirm(false)}
              >
                Keep practicing
              </Button>
              <Button variant="danger" fullWidth onClick={confirmExit}>
                Exit anyway
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}