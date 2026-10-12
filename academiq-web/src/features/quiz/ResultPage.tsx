import { useMemo, useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { Home, Eye, EyeOff } from "lucide-react";
import type { Question } from "../../lib/types";
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

export default function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;

  const [showReview, setShowReview] = useState(false);

  const questions = state.questions;
  const answers = state.answers;

  // If no state (user refreshed) → send to dashboard
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


  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Score */}
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary mb-6">
            Quiz Complete
          </h1>
          <ResultGradeCircle percentage={percentage} grade={grade} />
          <p className="text-sm sm:text-base text-text-secondary mt-5 max-w-md mx-auto">
            {message}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <StatBox label="Correct" value={correct} tone="success" />
          <StatBox label="Wrong" value={wrong} tone="danger" />
          <StatBox label="Skipped" value={unanswered} tone="warning" />
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

        {/* Review section */}
        {showReview && (
          <div className="space-y-4 pt-4 border-t border-bg-border">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-bold text-text-primary">
                Review
              </h2>
              <span className="text-xs text-text-muted">
                {questions.length} {questions.length === 1 ? "question" : "questions"}
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
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "danger" | "warning";
}) {
  const styles = {
    success: "bg-brand-success/10 border-brand-success/30 text-brand-success",
    danger: "bg-brand-danger/10 border-brand-danger/30 text-brand-danger",
    warning: "bg-brand-warning/10 border-brand-warning/30 text-brand-warning",
  }[tone];

  return (
    <div className={`rounded-xl border ${styles} p-4 text-center`}>
      <div className="text-2xl sm:text-3xl font-black leading-none">
        {value}
      </div>
      <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider mt-1.5 opacity-80">
        {label}
      </div>
    </div>
  );
}