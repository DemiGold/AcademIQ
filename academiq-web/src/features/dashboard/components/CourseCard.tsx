import { Link } from "react-router-dom";
import { BookOpen, FileText, Lock } from "lucide-react";
import type { CourseWithStats } from "../../../services/courseService";

interface Props {
  course: CourseWithStats;
  isPremium: boolean;
}

export default function CourseCard({ course, isPremium }: Props) {
  const hasLocked = !isPremium && course.total_questions > course.available_questions;
  const totalShown = isPremium ? course.total_questions : course.available_questions;

  return (
    <Link
      to={`/courses/${course.code}`}
      className="group block rounded-xl border border-bg-border bg-bg-secondary p-5 hover:border-brand-primary/40 hover:shadow-md transition"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-text-primary truncate">
            {course.code}
          </h3>
          <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
            {course.name}
          </p>
        </div>
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            hasLocked
              ? "bg-brand-warning/10 text-brand-warning"
              : "bg-brand-primary/10 text-brand-primary"
          }`}
        >
          {hasLocked ? <Lock size={16} /> : <BookOpen size={16} />}
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-text-muted border-t border-bg-border pt-3">
        <span className="inline-flex items-center gap-1">
          <FileText size={12} />
          {totalShown} {totalShown === 1 ? "question" : "questions"}
          {hasLocked && (
            <span className="text-brand-warning font-semibold">
              {" "}
              +{course.total_questions - course.available_questions} locked
            </span>
          )}
        </span>
      </div>
    </Link>
  );
}