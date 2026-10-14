import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Search, X } from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { useCourses } from "../../hooks/useCourses";
import { isPremium } from "../../lib/utils";
import { CourseGridSkeleton } from "../../components/ui/Skeleton";
import CourseCard from "../dashboard/components/CourseCard";

export default function CoursesListPage() {
  const profile = useAuthStore((s) => s.profile);
  const { data: courses, isLoading, error } = useCourses();
  const [search, setSearch] = useState("");

  const premium = isPremium(profile);

  const filtered = useMemo(() => {
    if (!courses) return [];
    if (!search.trim()) return courses;
    const q = search.toLowerCase();
    return courses.filter(
      (c) =>
        c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
  }, [courses, search]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2">
          <BookOpen size={22} className="text-brand-primary" />
          Courses
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          {isLoading
            ? "Loading your courses..."
            : courses
            ? `${courses.length} ${
                courses.length === 1 ? "course" : "courses"
              } available for your faculty`
            : ""}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by course code or name..."
          disabled={isLoading}
          className="w-full pl-10 pr-10 py-3 rounded-lg border border-bg-border bg-bg-secondary text-text-primary placeholder:text-text-muted text-base focus:outline-none focus:ring-2 focus:border-brand-primary focus:ring-brand-primary/20 transition disabled:opacity-60"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-text-muted hover:text-text-primary transition"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <CourseGridSkeleton count={6} />
      ) : error ? (
        <div className="rounded-xl border border-brand-danger/30 bg-brand-danger/10 px-4 py-3 text-sm text-brand-danger">
          Failed to load courses: {(error as Error).message}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-bg-border bg-bg-secondary px-6 py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-bg-tertiary flex items-center justify-center mx-auto mb-3">
            <BookOpen size={22} className="text-text-muted" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary mb-1">
            {search.trim() ? "No matching courses" : "No courses available"}
          </h3>
          <p className="text-xs text-text-secondary max-w-xs mx-auto">
            {search.trim()
              ? "Try a different search term."
              : "Check back soon. New courses are being added."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((course) => (
            <CourseCard key={course.id} course={course} isPremium={premium} />
          ))}
        </div>
      )}

      {/* Footer link for convenience */}
      {!isLoading && filtered.length > 0 && (
        <p className="text-center text-xs text-text-muted pt-2">
          <Link to="/dashboard" className="hover:text-text-secondary transition">
            ← Back to dashboard
          </Link>
        </p>
      )}
    </div>
  );
}