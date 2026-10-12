import { CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import type { Question } from "../../../lib/types";

const LABELS = ["A", "B", "C", "D"];

interface Props {
  question: Question;
  index: number;
  selectedIndex: number | null;
}

export default function ReviewCard({ question, index, selectedIndex }: Props) {
  const isCorrect = selectedIndex === question.correct_index;
  const isUnanswered = selectedIndex === null;

  const status = isUnanswered ? "unanswered" : isCorrect ? "correct" : "wrong";

  const borderColor = {
    correct: "border-l-brand-success",
    wrong: "border-l-brand-danger",
    unanswered: "border-l-brand-warning",
  }[status];

  const StatusIcon =
    status === "correct" ? CheckCircle2 : status === "wrong" ? XCircle : MinusCircle;

  const statusColor = {
    correct: "text-brand-success",
    wrong: "text-brand-danger",
    unanswered: "text-brand-warning",
  }[status];

  return (
    <div
      className={`rounded-xl border border-bg-border border-l-4 ${borderColor} bg-bg-secondary p-4 sm:p-5`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <StatusIcon
          size={20}
          className={`${statusColor} shrink-0 mt-0.5`}
        />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">
            Question {index + 1}
            {question.topic_name && (
              <span className="ml-2 text-text-muted/70 font-medium normal-case tracking-normal">
                · {question.topic_name}
              </span>
            )}
          </div>
          <p className="text-sm sm:text-base font-semibold text-text-primary leading-relaxed">
            {question.question_text}
          </p>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2 mb-4">
        {question.options.map((opt, i) => {
          const isCorrectOption = i === question.correct_index;
          const isSelectedOption = i === selectedIndex;

          let className = "border-bg-border bg-bg-primary";
          let badge: React.ReactNode = null;

          if (isCorrectOption) {
            className = "border-brand-success bg-brand-success/10";
            badge = (
              <span className="text-[10px] font-bold uppercase text-brand-success shrink-0">
                {isSelectedOption ? "✓ Your answer · Correct" : "Correct answer"}
              </span>
            );
          } else if (isSelectedOption) {
            className = "border-brand-danger bg-brand-danger/10";
            badge = (
              <span className="text-[10px] font-bold uppercase text-brand-danger shrink-0">
                Your answer
              </span>
            );
          }

          return (
            <div
              key={i}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${className}`}
            >
              <span
                className={`shrink-0 w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold ${
                  isCorrectOption
                    ? "bg-brand-success text-white"
                    : isSelectedOption
                    ? "bg-brand-danger text-white"
                    : "bg-bg-tertiary text-text-muted"
                }`}
              >
                {LABELS[i]}
              </span>
              <span className="flex-1 text-xs sm:text-sm text-text-primary leading-snug">
                {opt}
              </span>
              {badge}
            </div>
          );
        })}
      </div>

      {/* Explanation */}
      {question.explanation && (
        <div className="rounded-lg bg-brand-warning/5 border border-brand-warning/20 p-3">
          <div className="flex items-start gap-2">
            <span className="text-base leading-none">💡</span>
            <div className="flex-1 text-xs sm:text-sm text-text-secondary leading-relaxed">
              <span className="font-bold text-text-primary">Explanation: </span>
              {question.explanation}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}