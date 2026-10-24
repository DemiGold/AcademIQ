import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Calculator, Award, RotateCcw, TrendingUp } from "lucide-react";
import {
  GRADE_OPTIONS,
  GRADE_POINTS,
  type CourseEntry,
  type Grade,
  calculateCGPA,
  classifyDegree,
  generateId,
} from "./utils/grades";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";

const STORAGE_KEY = "academiq-cgpa-v1";

function loadStored(): CourseEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultEntries();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // ignore
  }
  return defaultEntries();
}

function defaultEntries(): CourseEntry[] {
  return [
    { id: generateId(), code: "", units: 3, grade: "A" },
    { id: generateId(), code: "", units: 2, grade: "B" },
    { id: generateId(), code: "", units: 3, grade: "C" },
  ];
}

function nextClassInfo(cgpa: number): {
  nextLabel: string;
  pointsNeeded: number;
  currentFloor: number;
  nextFloor: number;
} | null {
  if (cgpa >= 4.5) return null;
  if (cgpa >= 3.5)
    return { nextLabel: "First Class", pointsNeeded: 4.5 - cgpa, currentFloor: 3.5, nextFloor: 4.5 };
  if (cgpa >= 2.4)
    return { nextLabel: "Second Class Upper", pointsNeeded: 3.5 - cgpa, currentFloor: 2.4, nextFloor: 3.5 };
  if (cgpa >= 1.5)
    return { nextLabel: "Second Class Lower", pointsNeeded: 2.4 - cgpa, currentFloor: 1.5, nextFloor: 2.4 };
  return { nextLabel: "Third Class", pointsNeeded: 1.5 - cgpa, currentFloor: 0, nextFloor: 1.5 };
}

export default function CGPACalculatorPage() {
  const [courses, setCourses] = useState<CourseEntry[]>(() => loadStored());
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
  }, [courses]);

  const { cgpa, totalUnits, totalPoints } = useMemo(
    () => calculateCGPA(courses),
    [courses]
  );

  const classification = classifyDegree(cgpa);
  const next = nextClassInfo(cgpa);

  const addCourse = () => {
    setCourses((prev) => [
      ...prev,
      { id: generateId(), code: "", units: 3, grade: "A" },
    ]);
  };

  const updateCourse = <K extends keyof CourseEntry>(
    id: string,
    key: K,
    value: CourseEntry[K]
  ) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [key]: value } : c))
    );
  };

  const removeCourse = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  const resetAll = () => setResetConfirm(true);

  const confirmReset = () => {
    setResetConfirm(false);
    setCourses(defaultEntries());
  };

  const toneStyles: Record<string, string> = {
    success: "bg-brand-success/10 text-brand-success border-brand-success/30",
    brand: "bg-brand-primary/10 text-brand-primary border-brand-primary/30",
    warning: "bg-brand-warning/10 text-brand-warning border-brand-warning/30",
    danger: "bg-brand-danger/10 text-brand-danger border-brand-danger/30",
  };

  const progressPct = next
    ? Math.min(
        100,
        Math.max(
          0,
          ((cgpa - next.currentFloor) / (next.nextFloor - next.currentFloor)) * 100
        )
      )
    : 100;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2">
            <Calculator size={22} className="text-brand-primary" />
            CGPA Calculator
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Enter your courses, units, and grades. 5-point scale.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={resetAll}>
          <RotateCcw size={14} />
          Reset
        </Button>
      </div>

      <div className="rounded-2xl border border-bg-border bg-gradient-to-br from-brand-primary/10 via-bg-secondary to-bg-secondary p-6 sm:p-8 text-center">
        <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
          Cumulative GPA
        </div>
        <div className="text-5xl sm:text-6xl font-black text-text-primary leading-none mt-2">
          {cgpa.toFixed(2)}
        </div>
        <div
          className={`inline-flex items-center gap-1.5 mt-4 px-4 py-1.5 rounded-full border text-sm font-bold ${toneStyles[classification.tone]}`}
        >
          <Award size={16} />
          {classification.label}
        </div>

        {next && (
          <div className="mt-6 max-w-sm mx-auto">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-text-muted font-medium">{classification.label}</span>
              <span className="text-text-muted font-medium">{next.nextLabel}</span>
            </div>
            <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs text-text-secondary mt-2 flex items-center justify-center gap-1">
              <TrendingUp size={12} className="text-brand-primary" />
              {next.pointsNeeded.toFixed(2)} points to {next.nextLabel}
            </p>
          </div>
        )}

        <div className="flex items-center justify-center gap-8 mt-6 pt-5 border-t border-bg-border">
          <div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
              Total Units
            </div>
            <div className="text-lg font-bold text-text-primary mt-0.5">
              {totalUnits}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
              Total Points
            </div>
            <div className="text-lg font-bold text-text-primary mt-0.5">
              {totalPoints}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
              Courses
            </div>
            <div className="text-lg font-bold text-text-primary mt-0.5">
              {courses.length}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-text-primary">Courses</h2>
          <span className="text-xs text-text-muted">
            {courses.length} {courses.length === 1 ? "course" : "courses"}
          </span>
        </div>

        {courses.map((course, index) => {
          const points = course.units * GRADE_POINTS[course.grade];
          return (
            <div
              key={course.id}
              className="rounded-xl border border-bg-border bg-bg-secondary p-3 sm:p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-7 h-7 rounded-full bg-bg-tertiary flex items-center justify-center text-xs font-bold text-text-muted shrink-0">
                  {index + 1}
                </div>
                <input
                  type="text"
                  value={course.code}
                  onChange={(e) =>
                    updateCourse(course.id, "code", e.target.value.toUpperCase())
                  }
                  placeholder="Course code (e.g. MTH101)"
                  className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-bg-border bg-bg-secondary text-text-primary placeholder:text-text-muted text-sm font-semibold uppercase focus:outline-none focus:ring-2 focus:border-brand-primary focus:ring-brand-primary/20"
                />
                <button
                  onClick={() => removeCourse(course.id)}
                  disabled={courses.length === 1}
                  className="p-2 rounded-lg text-text-muted hover:text-brand-danger hover:bg-brand-danger/10 transition disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                  aria-label="Remove course"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-center gap-2 pl-10">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">
                    Units
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    inputMode="numeric"
                    value={course.units}
                    onChange={(e) =>
                      updateCourse(
                        course.id,
                        "units",
                        Math.max(0, parseInt(e.target.value) || 0)
                      )
                    }
                    className="w-full px-3 py-2 rounded-lg border border-bg-border bg-bg-secondary text-text-primary text-sm font-semibold focus:outline-none focus:ring-2 focus:border-brand-primary focus:ring-brand-primary/20"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">
                    Grade
                  </label>
                  <select
                    value={course.grade}
                    onChange={(e) =>
                      updateCourse(course.id, "grade", e.target.value as Grade)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-bg-border bg-bg-secondary text-text-primary text-sm font-semibold focus:outline-none focus:ring-2 focus:border-brand-primary focus:ring-brand-primary/20"
                  >
                    {GRADE_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g} ({GRADE_POINTS[g]})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-20">
                  <div className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">
                    Points
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-bg-tertiary text-text-primary text-sm font-bold text-center">
                    {points}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <Button variant="secondary" size="lg" fullWidth onClick={addCourse}>
          <Plus size={16} />
          Add course
        </Button>
      </div>

      <p className="text-xs text-text-muted text-center">
        Saved automatically to this browser. Nothing sent to the server.
      </p>

      <ConfirmDialog
        open={resetConfirm}
        title="Clear all courses?"
        message="This will remove every course you have entered and start fresh. This can't be undone."
        confirmLabel="Clear all"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={confirmReset}
        onCancel={() => setResetConfirm(false)}
      />
    </div>
  );
}
