import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Edit3,
  Trash2,
  BookOpen,
  Eye,
  EyeOff,
  FileText,
  Search,
  Layers,
} from "lucide-react";
import {
  fetchAllCourses,
  fetchQuestionCountsByCourse,
  toggleCourseActive,
  deleteCourse,
  type CourseRow,
} from "../services/adminService";
import CourseFormModal from "../features/courses/CourseFormModal";
import TopicManagerModal from "../features/courses/TopicManagerModal";

const FACULTIES = ["Science", "Management Sciences", "Engineering"] as const;
const FACULTY_ABBR: Record<string, string> = {
  Science: "SCI",
  "Management Sciences": "MS",
  Engineering: "ENGR",
};

export default function Courses() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "hidden">("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CourseRow | null>(null);
  const [topicsFor, setTopicsFor] = useState<CourseRow | null>(null);

  const coursesQuery = useQuery({
    queryKey: ["all-courses"],
    queryFn: fetchAllCourses,
  });

  const countsQuery = useQuery({
    queryKey: ["question-counts"],
    queryFn: fetchQuestionCountsByCourse,
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleCourseActive(id, isActive),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-courses"] });
      qc.invalidateQueries({ queryKey: ["courses"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e) => alert(`Toggle failed: ${(e as Error).message}`),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteCourse(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-courses"] });
      qc.invalidateQueries({ queryKey: ["courses"] });
      qc.invalidateQueries({ queryKey: ["question-counts"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e) => alert(`Delete failed: ${(e as Error).message}`),
  });

  const handleDelete = (course: CourseRow, questionCount: number) => {
    const warning =
      questionCount > 0
        ? `⚠️ "${course.code}" has ${questionCount} questions.\n\nDeleting the course will ALSO delete ALL its questions and topics.\n\nThis cannot be undone. Continue?`
        : `Delete course "${course.code} — ${course.name}"?`;

    if (confirm(warning)) {
      deleteMut.mutate(course.id);
    }
  };

  const handleAddNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (course: CourseRow) => {
    setEditing(course);
    setFormOpen(true);
  };

  const handleSaved = () => {
    qc.invalidateQueries({ queryKey: ["all-courses"] });
    qc.invalidateQueries({ queryKey: ["courses"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  };

  const courses = coursesQuery.data ?? [];
  const counts = countsQuery.data ?? {};

  const filtered = useMemo(() => {
    let list = courses;
    if (filter === "active") list = list.filter((c) => c.is_active);
    if (filter === "hidden") list = list.filter((c) => !c.is_active);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [courses, filter, search]);

  const totalQuestions = useMemo(
    () => Object.values(counts).reduce((a, b) => a + b, 0),
    [counts]
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Courses</h2>
          <p className="text-sm text-text-secondary mt-1">
            Manage the courses visible to students in the mobile app.
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="px-4 py-2.5 bg-gradient-to-r from-[#1A5276] to-[#2E86C1] text-white rounded-lg text-sm font-semibold hover:opacity-95 transition flex items-center gap-2 shadow-sm shadow-blue-500/20 shrink-0"
        >
          <Plus size={15} /> Add Course
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStat icon={BookOpen} label="Total Courses" value={courses.length} tone="brand" />
        <MiniStat
          icon={Eye}
          label="Active"
          value={courses.filter((c) => c.is_active).length}
          tone="success"
        />
        <MiniStat
          icon={EyeOff}
          label="Hidden"
          value={courses.filter((c) => !c.is_active).length}
          tone="warning"
        />
        <MiniStat icon={FileText} label="Total Questions" value={totalQuestions} tone="accent" />
      </div>

      <div className="bg-white rounded-xl border border-bg-border p-3 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search by code or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-bg-border focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/10 text-sm transition"
          />
        </div>

        <div className="flex gap-1 bg-bg-tertiary p-1 rounded-lg">
          {(["all", "active", "hidden"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition ${
                filter === f
                  ? "bg-white text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {coursesQuery.isLoading ? (
        <div className="bg-white rounded-xl border border-bg-border p-16 text-center text-text-muted text-sm">
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-bg-border p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-bg-tertiary flex items-center justify-center mx-auto mb-4">
            <BookOpen size={24} className="text-text-muted" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary mb-1">
            {courses.length === 0 ? "No courses yet" : "No matching courses"}
          </h3>
          <p className="text-xs text-text-secondary max-w-xs mx-auto">
            {courses.length === 0
              ? "Click 'Add Course' to create your first course."
              : "Try adjusting your search or filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((course) => {
            const qCount = counts[course.id] ?? 0;
            const targets = course.target_faculties ?? [];
            const isUniversal =
              targets.length === 0 || targets.length === FACULTIES.length;
            return (
              <div
                key={course.id}
                className={`bg-white rounded-xl border p-5 transition group hover:shadow-md ${
                  course.is_active ? "border-bg-border" : "border-dashed border-bg-border opacity-75"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-lg font-bold text-text-primary truncate">
                        {course.code}
                      </h3>
                      {course.is_active ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-brand-success/10 text-brand-success text-[10px] font-bold uppercase">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-bg-tertiary text-text-muted text-[10px] font-bold uppercase">
                          Hidden
                        </span>
                      )}
                      {isUniversal ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold uppercase">
                          All
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase">
                          {targets.map((f) => FACULTY_ABBR[f] ?? f).join(" + ")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-2">
                      {course.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-text-muted border-t border-bg-border pt-3 mb-3">
                  <span className="inline-flex items-center gap-1">
                    <FileText size={12} />
                    {qCount} {qCount === 1 ? "question" : "questions"}
                  </span>
                  <span className="text-text-muted">·</span>
                  <span>
                    {new Date(course.created_at).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTopicsFor(course)}
                    className="px-3 py-2 rounded-lg border border-bg-border text-text-secondary hover:bg-brand-primary/10 hover:border-brand-primary/30 hover:text-brand-primary text-xs font-semibold transition flex items-center justify-center gap-1.5"
                    title="Manage topics"
                  >
                    <Layers size={13} />
                  </button>
                  <button
                    onClick={() => handleEdit(course)}
                    className="flex-1 px-3 py-2 rounded-lg border border-bg-border text-text-secondary hover:bg-bg-tertiary text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                  <button
                    onClick={() =>
                      toggleMut.mutate({ id: course.id, isActive: course.is_active })
                    }
                    disabled={toggleMut.isPending}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                      course.is_active
                        ? "border border-bg-border text-text-secondary hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700"
                        : "border border-bg-border text-text-secondary hover:bg-green-50 hover:border-green-200 hover:text-green-700"
                    } disabled:opacity-50`}
                  >
                    {course.is_active ? (
                      <>
                        <EyeOff size={13} /> Hide
                      </>
                    ) : (
                      <>
                        <Eye size={13} /> Show
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(course, qCount)}
                    disabled={deleteMut.isPending}
                    className="p-2 rounded-lg border border-bg-border text-text-secondary hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CourseFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
        editing={editing}
      />

      <TopicManagerModal
        open={!!topicsFor}
        onClose={() => setTopicsFor(null)}
        course={topicsFor}
      />
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone: "brand" | "success" | "warning" | "accent";
}) {
  const tones: Record<string, string> = {
    brand: "bg-brand-primary/10 text-brand-primary",
    success: "bg-brand-success/10 text-brand-success",
    warning: "bg-brand-warning/10 text-amber-600",
    accent: "bg-brand-accent/10 text-amber-700",
  };

  return (
    <div className="bg-white border border-bg-border rounded-xl p-4 flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${tones[tone]}`}
      >
        <Icon size={18} />
      </div>
      <div>
        <div className="text-xs font-semibold text-text-muted uppercase tracking-wide">
          {label}
        </div>
        <div className="text-xl font-bold text-text-primary leading-tight">
          {value}
        </div>
      </div>
    </div>
  );
}