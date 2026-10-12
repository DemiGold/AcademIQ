import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  BarChart3,
  Target,
  TrendingUp,
  Users as UsersIcon,
  X,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  fetchAttempts,
  fetchAttemptStats,
  fetchAttemptDetail,
  fetchCourses,
  type AttemptAnswer,
} from "../services/adminService";

const PAGE_SIZE = 50;
const LABELS = ["A", "B", "C", "D"];

export default function Attempts() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [courseId, setCourseId] = useState<string>("");
  const [scoreBand, setScoreBand] = useState<"all" | "high" | "mid" | "low">("all");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);

  // Debounce search — useEffect (not useMemo, which ignores cleanup)
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const scoreRange = useMemo(() => {
    if (scoreBand === "high") return { min: 70, max: null };
    if (scoreBand === "mid") return { min: 50, max: 69 };
    if (scoreBand === "low") return { min: null, max: 49 };
    return { min: null, max: null };
  }, [scoreBand]);

  const statsQuery = useQuery({
    queryKey: ["attempt-stats"],
    queryFn: fetchAttemptStats,
  });

  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: fetchCourses,
  });

  const attemptsQuery = useQuery({
    queryKey: ["attempts", debouncedSearch, courseId, scoreBand, page],
    queryFn: () =>
      fetchAttempts({
        search: debouncedSearch,
        courseId: courseId || null,
        minScore: scoreRange.min,
        maxScore: scoreRange.max,
        page,
        pageSize: PAGE_SIZE,
      }),
    placeholderData: (prev) => prev,
  });

  const rows = attemptsQuery.data?.rows ?? [];
  const total = attemptsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const stats = statsQuery.data;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-text-primary">Exam Attempts</h2>
        <p className="text-sm text-text-secondary mt-1">
          Track every quiz attempt across the platform.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStat
          icon={BarChart3}
          label="Total Attempts"
          value={stats?.total_attempts ?? 0}
          tone="brand"
        />
        <MiniStat
          icon={Target}
          label="Average Score"
          value={stats?.average_score ? `${stats.average_score}%` : "0%"}
          tone="warning"
        />
        <MiniStat
          icon={TrendingUp}
          label="Pass Rate"
          value={stats ? `${stats.pass_rate}%` : "0%"}
          tone="success"
        />
        <MiniStat
          icon={UsersIcon}
          label="Active Students"
          value={stats?.unique_students ?? 0}
          tone="accent"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-bg-border p-3 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by student name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-bg-border focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/10 text-sm transition"
          />
        </div>

        <select
          value={courseId}
          onChange={(e) => {
            setCourseId(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-bg-border focus:border-brand-primary focus:outline-none text-sm bg-white"
        >
          <option value="">All courses</option>
          {coursesQuery.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code}
            </option>
          ))}
        </select>

        <div className="flex gap-1 bg-bg-tertiary p-1 rounded-lg">
          {(["all", "high", "mid", "low"] as const).map((b) => (
            <button
              key={b}
              onClick={() => {
                setScoreBand(b);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition ${
                scoreBand === b
                  ? "bg-white text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {b === "all" ? "All" : b === "high" ? "70%+" : b === "mid" ? "50-69%" : "<50%"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-bg-border overflow-hidden">
        {attemptsQuery.isLoading ? (
          <div className="p-16 text-center text-text-muted text-sm">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-bg-tertiary flex items-center justify-center mx-auto mb-4">
              <BarChart3 size={24} className="text-text-muted" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">
              No attempts yet
            </h3>
            <p className="text-xs text-text-secondary max-w-xs mx-auto">
              Attempts will appear here once students start taking exams in the mobile app.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-bg-border bg-bg-primary/40">
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3 w-32">Course</th>
                <th className="px-5 py-3 w-32">Score</th>
                <th className="px-5 py-3 w-28">Correct</th>
                <th className="px-5 py-3 w-40">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const band = getScoreBand(a.score_percent);
                return (
                  <tr
                    key={a.id}
                    className="border-b border-bg-border last:border-0 hover:bg-bg-primary/30 transition cursor-pointer group"
                    onClick={() => setDetailId(a.id)}
                  >
                    <td className="px-5 py-3">
                      <div className="text-sm font-semibold text-text-primary">
                        {a.username ?? a.full_name ?? "Anonymous"}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-md bg-bg-tertiary text-text-secondary text-xs font-mono font-semibold">
                        {a.course_code}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${band.color}`}>
                          {a.score_percent}%
                        </span>
                        <span
                          className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${band.bg}`}
                        >
                          {band.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-text-secondary">
                      {a.correct_count} / {a.total_questions}
                    </td>
                    <td className="px-5 py-3 text-xs text-text-muted">
                      {new Date(a.created_at).toLocaleString("en-NG", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-muted">
            Showing{" "}
            <span className="font-semibold text-text-secondary">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)}
            </span>{" "}
            of <span className="font-semibold text-text-secondary">{total}</span>
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-bg-border text-sm text-text-secondary disabled:opacity-40 hover:bg-bg-tertiary transition"
            >
              Prev
            </button>
            <span className="px-3 py-1.5 text-sm text-text-secondary font-medium">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-bg-border text-sm text-text-secondary disabled:opacity-40 hover:bg-bg-tertiary transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      <AttemptDetailDrawer
        attemptId={detailId}
        onClose={() => setDetailId(null)}
      />
    </div>
  );
}

/* ============================================
   Attempt Detail Drawer
   ============================================ */
function AttemptDetailDrawer({
  attemptId,
  onClose,
}: {
  attemptId: string | null;
  onClose: () => void;
}) {
  const detailQuery = useQuery({
    queryKey: ["attempt-detail", attemptId],
    queryFn: () => fetchAttemptDetail(attemptId!),
    enabled: !!attemptId,
  });

  if (!attemptId) return null;

  const detail = detailQuery.data;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl h-full overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-bg-border px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h3 className="text-base font-bold text-text-primary">Attempt Details</h3>
            {detail && (
              <p className="text-xs text-text-muted mt-0.5">
                {detail.attempt.username ?? "Anonymous"} · {detail.attempt.course_code}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-bg-tertiary text-text-muted transition"
          >
            <X size={18} />
          </button>
        </div>

        {detailQuery.isLoading ? (
          <div className="p-16 text-center text-text-muted text-sm">Loading…</div>
        ) : !detail ? (
          <div className="p-16 text-center text-text-muted text-sm">
            Could not load attempt.
          </div>
        ) : (
          <div className="p-6 space-y-6">
            <div className="bg-bg-primary/40 rounded-xl p-5 grid grid-cols-3 gap-4">
              <SummaryStat
                label="Score"
                value={`${detail.attempt.score_percent}%`}
                color={getScoreBand(detail.attempt.score_percent).color}
              />
              <SummaryStat
                label="Correct"
                value={`${detail.attempt.correct_count}/${detail.attempt.total_questions}`}
              />
              <SummaryStat
                label="Date"
                value={new Date(detail.attempt.created_at).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "short",
                })}
              />
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-text-primary">
                Questions ({detail.answers.length})
              </h4>
              {detail.answers.map((ans, i) => (
                <AnswerCard key={ans.id} answer={ans} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AnswerCard({ answer, index }: { answer: AttemptAnswer; index: number }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        answer.is_correct
          ? "border-brand-success/30 bg-brand-success/5"
          : "border-red-200 bg-red-50/50"
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
            answer.is_correct ? "bg-brand-success text-white" : "bg-red-500 text-white"
          }`}
        >
          {answer.is_correct ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
        </div>
        <div className="flex-1 text-sm font-semibold text-text-primary leading-relaxed">
          <span className="text-text-muted mr-1">Q{index + 1}.</span>
          {answer.question_text}
        </div>
      </div>

      <div className="space-y-1.5 pl-9">
        {answer.options.map((opt, i) => {
          const isCorrect = i === answer.correct_index;
          const isSelected = i === answer.selected_index;
          let className = "text-xs text-text-secondary";
          let badge = null;

          if (isCorrect) {
            className = "text-xs text-brand-success font-semibold";
            badge = "✓ Correct";
          } else if (isSelected) {
            className = "text-xs text-red-600 font-semibold line-through";
            badge = "✗ Yours";
          }

          return (
            <div key={i} className={`flex items-center gap-2 ${className}`}>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-white border border-bg-border text-[10px] font-bold">
                {LABELS[i]}
              </span>
              <span className="flex-1">{opt}</span>
              {badge && (
                <span className="text-[10px] font-bold uppercase opacity-75">
                  {badge}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {answer.explanation && (
        <div className="mt-3 ml-9 p-3 bg-white border border-bg-border rounded-lg text-xs text-text-secondary leading-relaxed">
          <strong className="text-text-primary">Explanation:</strong> {answer.explanation}
        </div>
      )}
    </div>
  );
}

function SummaryStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="text-center">
      <div className="text-xs font-semibold text-text-muted uppercase tracking-wide">
        {label}
      </div>
      <div className={`text-xl font-bold mt-1 ${color ?? "text-text-primary"}`}>
        {value}
      </div>
    </div>
  );
}

function getScoreBand(score: number) {
  if (score >= 70)
    return { label: "Pass", color: "text-brand-success", bg: "bg-brand-success/10 text-brand-success" };
  if (score >= 50)
    return { label: "Pass", color: "text-amber-600", bg: "bg-amber-100 text-amber-700" };
  return { label: "Fail", color: "text-red-600", bg: "bg-red-100 text-red-700" };
}

function MiniStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  tone: "brand" | "success" | "warning" | "accent";
}) {
  const tones: Record<string, string> = {
    brand: "bg-brand-primary/10 text-brand-primary",
    success: "bg-brand-success/10 text-brand-success",
    warning: "bg-amber-100 text-amber-700",
    accent: "bg-purple-100 text-purple-700",
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