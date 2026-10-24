import { useMemo, useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import {
  Home,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Clock,
} from "lucide-react";
import type { Question } from "../../lib/types";
import { useQuizStore } from "../../stores/quizStore";
import Button from "../../components/ui/Button";
import ResultGradeCircle from "./components/ResultGradeCircle";
import ReviewCard from "./components/ReviewCard";

interface LocationState {
  attemptId?: string;
  questions?: Question[];
  answers?: Record<string, number>;
}

function gradeFor(pct: number): { grade: string; message: string } {
  if (pct >= 70) return { grade: "A", message: "Excellent work!" };
  if (pct >= 60) return { grade: "B", message: "Good job!" };
  if (pct >= 50) return { grade: "C", message: "Fair. Keep practicing." };
  if (pct >= 45) return { grade: "D", message: "You passed. Room to improve." };
  return { grade: "F", message: "Don't give up — practice more." };
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

export default function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;

  const courseCode = useQuizStore((s) => s.courseCode);
  const courseName = useQuizStore((s) => s.courseName);
  const topicName = useQuizStore((s) => s.topicName);
  const durationSeconds = useQuizStore((s) => s.durationSeconds);
  const timeLeft = useQuizStore((s) => s.timeLeft);

  const [showReview, setShowReview] = useState(false);

  const questions = state.questions;
  const answers = state.answers;
  const attemptId = state.attemptId;

  if (!questions || !answers) {
    return <Navigate to="/dashboard" replace />;
  }

  const { correct, wrong, unanswered, percentage } = useMemo(() => {
    let c = 0;
    let w = 0;
    let u = 0;
    for (const q of questions) {
      const sel = answers[q.id];
      if (sel === undefined) u++;
      else if (sel === q.correct_index) c++;
      else w++;
    }
    const pct =
      questions.length > 0 ? Math.round((c / questions.length) * 100) : 0;
    return { correct: c, wrong: w, unanswered: u, percentage: pct };
  }, [questions, answers]);

  const { grade, message } = gradeFor(percentage);

  const timeTaken =
    durationSeconds !== undefined && timeLeft !== undefined
      ? Math.max(0, durationSeconds - timeLeft)
      : null;

  const pctCorrect = Math.round((correct / questions.length) * 100);
  const pctWrong = Math.round((wrong / questions.length) * 100);
  const pctUnanswered = Math.max(0, 100 - pctCorrect - pctWrong);

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        {/* Hero */}
        <div className="rounded-2xl border border-bg-border bg-gradient-to-br from-brand-primary/5 via-bg-secondary to-bg-secondary p-6 sm:p-8">
          <div className="flex items-start justify-between gap-3 mb-6">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
                Quiz Complete
              </h1>
              {(courseCode || courseName) && (
                <p className="text-sm text-text-secondary mt-1 truncate">
                  {courseCode}
                  {courseName && ` — ${courseName}`}
                  {topicName && ` · ${topicName}`}
                </p>
              )}
            </div>
            {attemptId && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-success/10 text-brand-success text-xs font-semibold shrink-0">
                <Check size={12} />
                Saved
              </span>
            )}
          </div>

          <div className="flex flex-col items-center">
            <ResultGradeCircle percentage={percentage} grade={grade} />
            <p className="text-sm sm:text-base text-text-secondary mt-5 max-w-md text-center leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBox icon={CheckCircle2} label="Correct" value={correct} tone="success" />
          <StatBox icon={XCircle} label="Wrong" value={wrong} tone="danger" />
          <StatBox icon={MinusCircle} label="Skipped" value={unanswered} tone="warning" />
          <StatBox
            icon={Clock}
            label="Time"
            value={timeTaken !== null ? formatDuration(timeTaken) : "—"}
            tone="brand"
          />
        </div>

        {/* Breakdown bar */}
        <div className="rounded-xl border border-bg-border bg-bg-secondary p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-text-primary">Breakdown</span>
            <span className="text-xs text-text-muted">
              {questions.length} question{questions.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="h-3 rounded-full bg-bg-tertiary overflow-hidden flex">
            <div className="bg-brand-success h-full" style={{ width: `${pctCorrect}%` }} />
            <div className="bg-brand-danger h-full" style={{ width: `${pctWrong}%` }} />
            <div className="bg-brand-warning h-full" style={{ width: `${pctUnanswered}%` }} />
          </div>
          <div className="flex justify-between text-xs text-text-muted mt-2.5">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-brand-success" />
              {correct} correct
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-brand-danger" />
              {wrong} wrong
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-brand-warning" />
              {unanswered} skipped
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => navigate("/dashboard")}
          >
            <Home size={16} />
            Dashboard
          </Button>
          <Button
            size="lg"
            fullWidth
            onClick={() => setShowReview((v) => !v)}
          >
            {showReview ? <EyeOff size={16} /> : <Eye size={16} />}
            {showReview ? "Hide review" : "Review answers"}
          </Button>
        </div>

        {/* Review */}
        {showReview && (
          <div className="space-y-4 pt-2">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-bold text-text-primary">Detailed review</h2>
              <span className="text-xs text-text-muted">
                {questions.length} question{questions.length === 1 ? "" : "s"}
              </span>
            </div>

            {questions.map((q, i) => (
              <ReviewCard
                key={q.id}
                question={q}
                index={i}
                selectedIndex={answers[q.id] ?? null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  tone: "success" | "danger" | "warning" | "brand";
}) {
  const styles = {
    success: "bg-brand-success/10 border-brand-success/30 text-brand-success",
    danger: "bg-brand-danger/10 border-brand-danger/30 text-brand-danger",
    warning: "bg-brand-warning/10 border-brand-warning/30 text-brand-warning",
    brand: "bg-brand-primary/10 border-brand-primary/30 text-brand-primary",
  }[tone];

  return (
    <div className={`rounded-xl border p-4 text-center ${styles}`}>
      <div className="flex items-center justify-center gap-1.5 mb-1">
        <Icon size={14} />
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider opacity-80">
          {label}
        </span>
      </div>
      <div className="text-2xl font-black leading-none">{value}</div>
    </div>
  );
}
