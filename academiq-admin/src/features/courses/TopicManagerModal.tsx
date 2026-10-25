import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Plus, Trash2, Edit3, Check, Layers, BookOpen } from "lucide-react";
import {
  fetchTopics,
  createTopic,
  renameTopic,
  deleteTopic,
  updateTopicSummary,
  fetchQuestionCountsByTopic,
  type CourseRow,
} from "../../services/adminService";

interface Props {
  open: boolean;
  onClose: () => void;
  course: CourseRow | null;
}

export default function TopicManagerModal({ open, onClose, course }: Props) {
  const qc = useQueryClient();
  const [newTopic, setNewTopic] = useState("");
  
  // States for renaming
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  // States for editing summaries
  const [summaryTopicId, setSummaryTopicId] = useState<string | null>(null);
  const [summaryValue, setSummaryValue] = useState("");

  const topicsQuery = useQuery({
    queryKey: ["topics", course?.id],
    queryFn: () => fetchTopics(course!.id),
    enabled: !!course?.id && open,
  });

  const countsQuery = useQuery({
    queryKey: ["question-counts-by-topic"],
    queryFn: fetchQuestionCountsByTopic,
    enabled: open,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["topics"] });
    qc.invalidateQueries({ queryKey: ["question-counts-by-topic"] });
    qc.invalidateQueries({ queryKey: ["question-counts"] });
  };

  const addMut = useMutation({
    mutationFn: (name: string) => createTopic(course!.id, name),
    onSuccess: () => {
      setNewTopic("");
      invalidate();
    },
    onError: (e) => alert(`Add failed: ${(e as Error).message}`),
  });

  const renameMut = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameTopic(id, name),
    onSuccess: () => {
      setEditingId(null);
      setEditingValue("");
      invalidate();
    },
    onError: (e) => alert(`Rename failed: ${(e as Error).message}`),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteTopic(id),
    onSuccess: invalidate,
    onError: (e) => alert(`Delete failed: ${(e as Error).message}`),
  });

  const summaryMut = useMutation({
    mutationFn: ({ id, summary }: { id: string; summary: string }) => 
      updateTopicSummary(id, summary.trim() || null),
    onSuccess: () => {
      setSummaryTopicId(null);
      setSummaryValue("");
      invalidate();
    },
    onError: (e) => alert(`Save summary failed: ${(e as Error).message}`),
  });

  if (!open || !course) return null;

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim()) return;
    addMut.mutate(newTopic.trim());
  };

  const handleDelete = (id: string, name: string, count: number) => {
    const warning =
      count > 0
        ? `Delete topic "${name}"?\n\n⚠️ ${count} question${count === 1 ? "" : "s"} currently reference this topic. They'll become "uncategorized" but won't be deleted.`
        : `Delete topic "${name}"?`;
    if (confirm(warning)) deleteMut.mutate(id);
  };

  const topics = topicsQuery.data ?? [];
  const counts = countsQuery.data ?? {};

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-bg-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
              <Layers size={18} className="text-brand-primary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">
                Topics for {course.code}
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Organize questions and study notes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-bg-tertiary text-text-muted transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleAdd} className="px-6 py-4 border-b border-bg-border shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="New topic name (e.g. Integration)"
              className="flex-1 px-3 py-2.5 rounded-lg border border-bg-border focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/10 text-sm transition"
            />
            <button
              type="submit"
              disabled={!newTopic.trim() || addMut.isPending}
              className="px-4 py-2.5 rounded-lg bg-brand-primary text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <Plus size={15} /> Add
            </button>
          </div>
        </form>

        <div className="flex-1 overflow-y-auto">
          {topicsQuery.isLoading ? (
            <div className="p-10 text-center text-text-muted text-sm">Loading…</div>
          ) : topics.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-12 h-12 rounded-xl bg-bg-tertiary flex items-center justify-center mx-auto mb-3">
                <Layers size={18} className="text-text-muted" />
              </div>
              <p className="text-sm font-semibold text-text-primary mb-1">No topics yet</p>
              <p className="text-xs text-text-muted">Add one above to get started.</p>
            </div>
          ) : (
            <ul className="divide-y divide-bg-border">
              {topics.map((t) => {
                const isRenaming = editingId === t.id;
                const isEditingSummary = summaryTopicId === t.id;
                const count = counts[t.id] ?? 0;

                // If we are editing the summary, show the large textarea view for this item
                if (isEditingSummary) {
                  return (
                    <li key={t.id} className="p-4 bg-bg-primary/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-text-primary">
                          Summary Notes for "{t.name}"
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSummaryTopicId(null)}
                            className="px-3 py-1.5 rounded-lg border border-bg-border text-text-secondary text-xs font-semibold hover:bg-bg-tertiary transition"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => summaryMut.mutate({ id: t.id, summary: summaryValue })}
                            disabled={summaryMut.isPending}
                            className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-semibold hover:opacity-90 transition disabled:opacity-50"
                          >
                            {summaryMut.isPending ? "Saving..." : "Save Notes"}
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={summaryValue}
                        onChange={(e) => setSummaryValue(e.target.value)}
                        placeholder="Paste your chapter summary, formula sheet, or study guide here. Markdown is not supported, but line breaks are saved."
                        rows={8}
                        className="w-full px-3 py-2.5 rounded-lg border border-bg-border focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/10 text-sm transition resize-y font-mono"
                      />
                    </li>
                  );
                }

                // Default row view
                return (
                  <li key={t.id} className="px-6 py-3 flex items-center gap-3 group hover:bg-bg-primary/10 transition">
                    {isRenaming ? (
                      <>
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          autoFocus
                          className="flex-1 px-3 py-2 rounded-lg border border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/10 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") renameMut.mutate({ id: t.id, name: editingValue });
                            else if (e.key === "Escape") setEditingId(null);
                          }}
                        />
                        <button
                          onClick={() => renameMut.mutate({ id: t.id, name: editingValue })}
                          disabled={renameMut.isPending || !editingValue.trim()}
                          className="p-2 rounded-lg bg-brand-success/10 text-brand-success hover:bg-brand-success/20 transition"
                        >
                          <Check size={15} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-2 rounded-lg hover:bg-bg-tertiary text-text-muted transition"
                        >
                          <X size={15} />
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-text-primary truncate flex items-center gap-2">
                            {t.name}
                            {t.summary && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-brand-success/10 text-brand-success">
                                <BookOpen size={10} /> Notes Saved
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-text-muted">
                            {count} {count === 1 ? "question" : "questions"}
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() => {
                              setSummaryTopicId(t.id);
                              setSummaryValue(t.summary ?? "");
                            }}
                            className="px-3 py-2 rounded-lg bg-brand-primary/10 text-brand-primary text-xs font-semibold hover:bg-brand-primary/20 transition flex items-center gap-1.5"
                            title="Edit Study Notes"
                          >
                            <BookOpen size={13} /> Notes
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(t.id);
                              setEditingValue(t.name);
                            }}
                            className="p-2 rounded-lg hover:bg-bg-primary/10 text-text-secondary hover:text-brand-primary transition"
                            title="Rename Topic"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id, t.name, count)}
                            disabled={deleteMut.isPending}
                            className="p-2 rounded-lg hover:bg-red-50 text-text-secondary hover:text-red-500 transition disabled:opacity-50"
                            title="Delete Topic"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="px-6 py-4 border-t border-bg-border flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-bg-border text-text-secondary text-sm font-semibold hover:bg-bg-tertiary transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
