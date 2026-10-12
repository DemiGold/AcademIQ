import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import BulkUploadModal from "../features/questions/BulkUploadModal";
import QuestionFormModal from "../features/questions/QuestionFormModal";
import {
  Plus,
  Trash2,
  Edit3,
  Upload,
  ChevronLeft,
  ChevronRight,
  Search,
  FileText,
  CheckCircle2,
  Clock,
  Gift,
} from "lucide-react";
import {
  fetchCourses,
  fetchTopics,
  fetchQuestions,
  deleteQuestion,
  type QuestionRow,
} from "../services/adminService";

const PAGE_SIZE = 20;
const LABELS = ["A", "B", "C", "D"];

export default function Questions() {
  const qc = useQueryClient();
  const [courseId, setCourseId] = useState<string>("");
  const [topicId, setTopicId] = useState<string>("");
  const [status, setStatus] = useState<"all" | "draft" | "published">("all");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<QuestionRow | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: fetchCourses,
  });

  if (!courseId && coursesQuery.data?.length) {
    setCourseId(coursesQuery.data[0].id);
  }

  const topicsQuery = useQuery({
    queryKey: ["topics", courseId],
    queryFn: () => fetchTopics(courseId),
    enabled: !!courseId,
  });

  const questionsQuery = useQuery({
    queryKey: ["questions", courseId, topicId, status, page],
    queryFn: () =>
      fetchQuestions({
        courseId,
        topicId: topicId || null,
        status,
        page,
        pageSize: PAGE_SIZE,
      }),
    enabled: !!courseId,
    placeholderData: (prev) => prev,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteQuestion(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["questions"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e) => alert(`Delete failed: ${(e as Error).message}`),
  });

  const handleDelete = (q: QuestionRow) => {
    if (confirm(`Delete this question?\n\n"${q.question_text.slice(0, 80)}..."`)) {
      deleteMut.mutate(q.id);
    }
  };

  const handleAddNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (q: QuestionRow) => {
    setEditing(q);
    setFormOpen(true);
  };

  const handleSaved = () => {
    qc.invalidateQueries({ queryKey: ["questions"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  };

  const allRows = questionsQuery.data?.rows ?? [];
  const total = questionsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const rows = useMemo(() => {
    if (!search.trim()) return allRows;
    const q = search.toLowerCase();
    return allRows.filter((r) => r.question_text.toLowerCase().includes(q));
  }, [allRows, search]);

  const stats = useMemo(() => {
    const published = allRows.filter((r) => r.status === "published").length;
    const draft = allRows.filter((r) => r.status === "draft").length;
    const free = allRows.filter((r) => r.is_free).length;
    return { published, draft, free };
  }, [allRows]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Question Bank</h2>
          <p className="text-sm text-text-secondary mt-1">
            Manage exam questions by course and topic.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setBulkOpen(true)}
            className="px-4 py-2.5 bg-white border border-bg-border text-text-primary rounded-lg text-sm font-semibold hover:bg-bg-tertiary transition flex items-center gap-2"
          >
            <Upload size={15} /> Bulk Upload
          </button>
          <button
            onClick={handleAddNew}
            className="px-4 py-2.5 bg-gradient-to-r from-[#1A5276] to-[#2E86C1] text-white rounded-lg text-sm font-semibold hover:opacity-95 transition flex items-center gap-2 shadow-sm shadow-blue-500/20"
          >
            <Plus size={15} /> Add Question
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStat icon={FileText} label="Total" value={total} tone="brand" />
        <MiniStat icon={CheckCircle2} label="Published" value={stats.published} tone="success" />
        <MiniStat icon={Clock} label="Draft" value={stats.draft} tone="warning" />
        <MiniStat icon={Gift} label="Free" value={stats.free} tone="accent" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-bg-border p-3 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              placeholder="Search questions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-bg-border focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/10 text-sm transition"
            />
          </div>
        </div>

        <select
          value={courseId}
          onChange={(e) => {
            setCourseId(e.target.value);
            setTopicId("");
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-bg-border focus:border-brand-primary focus:outline-none text-sm bg-white"
        >
          {coursesQuery.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code}
            </option>
          ))}
        </select>

        <select
          value={topicId}
          onChange={(e) => {
            setTopicId(e.target.value);
            setPage(1);
          }}
          disabled={!courseId}
          className="px-3 py-2 rounded-lg border border-bg-border focus:border-brand-primary focus:outline-none text-sm bg-white disabled:opacity-50 max-w-[180px]"
        >
          <option value="">All topics</option>
          {topicsQuery.data?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <div className="flex gap-1 bg-bg-tertiary p-1 rounded-lg">
          {(["all", "published", "draft"] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition ${
                status === s
                  ? "bg-white text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-bg-border overflow-hidden">
        {questionsQuery.isLoading ? (
          <div className="p-16 text-center text-text-muted text-sm">Loading…</div>
        ) : rows.length === 0 ? (
          <EmptyState hasFilters={!!search || !!topicId || status !== "all"} />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-bg-border bg-bg-primary/40">
                <th className="px-5 py-3 w-12">#</th>
                <th className="px-5 py-3">Question</th>
                <th className="px-5 py-3 w-32">Topic</th>
                <th className="px-5 py-3 w-28">Status</th>
                <th className="px-5 py-3 w-20">Free</th>
                <th className="px-5 py-3 w-24 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((q, i) => (
                <tr
                  key={q.id}
                  className="border-b border-bg-border last:border-0 hover:bg-bg-primary/30 transition group"
                >
                  <td className="px-5 py-4 text-xs font-medium text-text-muted align-top pt-5">
                    {(page - 1) * PAGE_SIZE + i + 1}
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-sm font-medium text-text-primary leading-relaxed line-clamp-2">
                      {q.question_text}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 text-xs">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-brand-success/10 text-brand-success font-bold">
                        {LABELS[q.correct_index]}
                      </span>
                      <span className="text-text-muted truncate max-w-md">
                        {q.options[q.correct_index]}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-text-secondary align-top pt-5">
                    {q.topics?.name ?? (
                      <span className="text-text-muted italic">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 align-top pt-5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        q.status === "published"
                          ? "bg-brand-success/10 text-brand-success"
                          : "bg-brand-warning/10 text-amber-700"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          q.status === "published"
                            ? "bg-brand-success"
                            : "bg-brand-warning"
                        }`}
                      />
                      {q.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 align-top pt-5">
                    {q.is_free ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-brand-accent/10 text-amber-700 text-xs font-bold">
                        FREE
                      </span>
                    ) : (
                      <span className="text-xs text-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right align-top pt-5">
                    <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleEdit(q)}
                        className="p-2 rounded-lg hover:bg-brand-primary/10 text-text-secondary hover:text-brand-primary transition"
                        title="Edit"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(q)}
                        className="p-2 rounded-lg hover:bg-red-50 text-text-secondary hover:text-red-500 transition"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-muted">
            Showing <span className="font-semibold text-text-secondary">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)}</span> of{" "}
            <span className="font-semibold text-text-secondary">{total}</span>
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-bg-border text-sm text-text-secondary disabled:opacity-40 hover:bg-bg-tertiary transition flex items-center gap-1"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <span className="px-3 py-1.5 text-sm text-text-secondary font-medium">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-bg-border text-sm text-text-secondary disabled:opacity-40 hover:bg-bg-tertiary transition flex items-center gap-1"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <QuestionFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
        courseId={courseId}
        topics={topicsQuery.data ?? []}
        editing={editing}
      />

      <BulkUploadModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onSaved={handleSaved}
        courseId={courseId}
        topics={topicsQuery.data ?? []}
      />
    </div>
  );
}

/* --- Small helpers --- */

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

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="p-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-bg-tertiary flex items-center justify-center mx-auto mb-4">
        <FileText size={24} className="text-text-muted" />
      </div>
      <h3 className="text-sm font-semibold text-text-primary mb-1">
        {hasFilters ? "No matching questions" : "No questions yet"}
      </h3>
      <p className="text-xs text-text-secondary max-w-xs mx-auto">
        {hasFilters
          ? "Try changing your filters or search terms."
          : "Click 'Add Question' or 'Bulk Upload' to start building your question bank."}
      </p>
    </div>
  );
}