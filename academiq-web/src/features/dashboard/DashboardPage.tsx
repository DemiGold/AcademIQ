import { BookOpen, Sparkles, Trophy } from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { useCourses } from "../../hooks/useCourses";
import { isPremium } from "../../lib/utils";
import {
  CourseGridSkeleton,
  StatCardSkeleton,
} from "../../components/ui/Skeleton";
import PremiumBanner from "./components/PremiumBanner";
import CourseCard from "./components/CourseCard";

export default function DashboardPage() {
  const profile = useAuthStore((s) => s.profile);
  const { data: courses, isLoading, error } = useCourses();

  const premium = isPremium(profile);
  const name = profile?.full_name?.split(" ")[0] ?? "there";

  const totalAvailable =
    courses?.reduce(
      (sum, c) => sum + (premium ? c.total_questions : c.available_questions),
      0
    ) ?? 0;
  const totalLocked = premium
    ? 0
    : courses?.reduce(
        (sum, c) => sum + (c.total_questions - c.available_questions),
        0
      ) ?? 0;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
          Hey {name} 👋
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          {premium
            ? "You have full access. Let's practice."
            : "Welcome back. Here's what's available today."}
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              icon={BookOpen}
              label="Courses"
              value={courses?.length ?? 0}
              tone="brand"
            />
            <StatCard
              icon={Sparkles}
              label="Available"
              value={totalAvailable}
              tone="success"
            />
            <StatCard
              icon={Trophy}
              label="Locked"
              value={totalLocked}
              tone={totalLocked > 0 ? "warning" : "muted"}
            />
          </>
        )}
      </div>

      {/* Premium banner (only if free, and only after courses settle) */}
      {!premium && !isLoading && <PremiumBanner />}

      {/* Courses */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-base sm:text-lg font-bold text-text-primary">
            Your courses
          </h2>
          {courses && !isLoading && (
            <span className="text-xs text-text-muted">
              {courses.length} {courses.length === 1 ? "course" : "courses"}
            </span>
          )}
        </div>

        {isLoading ? (
          <CourseGridSkeleton count={6} />
        ) : error ? (
          <div className="rounded-xl border border-brand-danger/30 bg-brand-danger/10 px-4 py-3 text-sm text-brand-danger">
            Failed to load courses: {(error as Error).message}
          </div>
        ) : courses && courses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} isPremium={premium} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-bg-border bg-bg-secondary px-6 py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-bg-tertiary flex items-center justify-center mx-auto mb-3">
              <BookOpen size={22} className="text-text-muted" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">
              No courses available
            </h3>
            <p className="text-xs text-text-secondary max-w-xs mx-auto">
              Check back soon. New courses are being added.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone: "brand" | "success" | "warning" | "muted";
}) {
  const tones: Record<string, string> = {
    brand: "bg-brand-primary/10 text-brand-primary",
    success: "bg-brand-success/10 text-brand-success",
    warning: "bg-brand-warning/10 text-brand-warning",
    muted: "bg-bg-tertiary text-text-muted",
  };

  return (
    <div className="rounded-xl border border-bg-border bg-bg-secondary p-3 sm:p-4">
      <div
        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center mb-2 ${tones[tone]}`}
      >
        <Icon size={16} />
      </div>
      <div className="text-lg sm:text-xl font-bold text-text-primary leading-tight">
        {value}
      </div>
      <div className="text-[10px] sm:text-xs font-semibold text-text-muted uppercase tracking-wide mt-0.5">
        {label}
      </div>
    </div>
  );
}