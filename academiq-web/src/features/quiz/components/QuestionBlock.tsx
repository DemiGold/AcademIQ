import type { Question } from "../../../lib/types";
import { classNames } from "../../../lib/utils";

const LABELS = ["A", "B", "C", "D"];

interface Props {
  question: Question;
  index: number;
  total: number;
  selectedIndex: number | undefined;
  onSelect: (optionIndex: number) => void;
}

export default function QuestionBlock({
  question,
  index,
  total,
  selectedIndex,
  onSelect,
}: Props) {
  return (
    <div className="space-y-5">
      {/* Meta row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold">
          Question {index + 1} of {total}
        </span>
        {question.topic_name && (
          <span className="text-xs text-text-muted font-medium truncate max-w-[160px]">
            {question.topic_name}
          </span>
        )}
      </div>

      {/* Question text */}
      <div className="rounded-xl border-l-4 border-brand-primary bg-bg-tertiary px-4 py-4 sm:px-5 sm:py-5">
        <p className="text-base sm:text-lg font-semibold text-text-primary leading-relaxed">
          {question.question_text}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-2.5">
        {question.options.map((opt, i) => {
          const isSelected = selectedIndex === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(i)}
              className={classNames(
                "w-full flex items-center gap-3 px-3 sm:px-4 py-3 rounded-xl border-2 text-left transition min-h-[52px]",
                isSelected
                  ? "border-brand-primary bg-brand-primary/10"
                  : "border-bg-border bg-bg-secondary hover:border-brand-primary/40 hover:bg-bg-tertiary"
              )}
            >
              <span
                className={classNames(
                  "shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition",
                  isSelected
                    ? "bg-brand-primary text-white"
                    : "bg-bg-tertiary text-text-secondary"
                )}
              >
                {LABELS[i]}
              </span>
              <span className="flex-1 text-sm sm:text-base text-text-primary leading-snug">
                {opt}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}