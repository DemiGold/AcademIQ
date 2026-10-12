import { X } from "lucide-react";
import { formatTime } from "../../../lib/utils";

interface Props {
  courseCode: string;
  current: number;
  total: number;
  timeLeft: number;
  onExit: () => void;
  onSubmit: () => void;
  submitting?: boolean;
}

export default function QuizTopBar({
  courseCode,
  current,
  total,
  timeLeft,
  onExit,
  onSubmit,
  submitting,
}: Props) {
  const isWarning = timeLeft < 300; // 5 minutes

  return (
    <div className="sticky top-0 z-20 border-b border-bg-border bg-bg-secondary/95 backdrop-blur-md">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* Exit */}
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs sm:text-sm font-semibold text-text-secondary hover:text-brand-danger hover:bg-brand-danger/10 transition"
        >
          <X size={16} />
          <span className="hidden xs:inline">Exit</span>
        </button>

        {/* Timer */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 font-bold text-sm sm:text-base font-mono ${
            isWarning
              ? "border-brand-danger text-brand-danger animate-pulse"
              : "border-brand-primary text-brand-primary"
          }`}
        >
          <span className="text-xs sm:text-sm">{courseCode}</span>
          <span className="text-text-muted font-normal">·</span>
          <span>{formatTime(timeLeft)}</span>
        </div>

        {/* Submit */}
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="px-3 py-2 rounded-lg bg-brand-primary text-white text-xs sm:text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
        >
          {submitting ? "…" : "Submit"}
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-bg-tertiary">
        <div
          className="h-full bg-brand-success transition-all duration-300"
          style={{ width: `${((current + 1) / total) * 100}%` }}
        />
      </div>
    </div>
  );
}