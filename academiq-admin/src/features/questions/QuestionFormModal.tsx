import { useState, useEffect, type FormEvent } from "react";
import { X } from "lucide-react";
import {
  createQuestion,
  updateQuestion,
  type QuestionRow,
  type TopicOption,
  type QuestionPayload,
} from "../../services/adminService";

const LABELS = ["A", "B", "C", "D"];

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  courseId: string;
  topics: TopicOption[];
  editing: QuestionRow | null;
}

interface FormState {
  topic_id: string;
  question_text: string;
  optA: string;
  optB: string;
  optC: string;
  optD: string;
  correct_index: number;
  explanation: string;
  academic_session: string;
  semester: string;
  institution: string;
  is_free: boolean;
  status: "draft" | "published";
}

const EMPTY: FormState = {
  topic_id: "",
  question_text: "",
  optA: "",
  optB: "",
  optC: "",
  optD: "",
  correct_index: 0,
  explanation: "",
  academic_session: "",
  semester: "",
  institution: "UNILAG",
  is_free: false,
  status: "draft",
};

export default function QuestionFormModal({
  open,
  onClose,
  onSaved,
  courseId,
  topics,
  editing,
}: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        topic_id: editing.topic_id ?? "",
        question_text: editing.question_text,
        optA: editing.options[0] ?? "",
        optB: editing.options[1] ?? "",
        optC: editing.options[2] ?? "",
        optD: editing.options[3] ?? "",
        correct_index: editing.correct_index,
        explanation: editing.explanation ?? "",
        academic_session: editing.academic_session ?? "",
        semester: editing.semester ?? "",
        institution: editing.institution ?? "UNILAG",
        is_free: editing.is_free,
        status: editing.status,
      });
    } else {
      setForm({ ...EMPTY, topic_id: topics[0]?.id ?? "" });
    }
    setError(null);
  }, [open, editing, topics]);

  if (!open) return null;

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.question_text.trim()) return setError("Question text is required.");
    if (!form.optA.trim() || !form.optB.trim() || !form.optC.trim() || !form.optD.trim())
      return setError("All four options are required.");
    if (!courseId) return setError("No course selected.");

    const payload: QuestionPayload = {
      course_id: courseId,
      topic_id: form.topic_id || null,
      question_text: form.question_text.trim(),
      options: [form.optA.trim(), form.optB.trim(), form.optC.trim(), form.optD.trim()],
      correct_index: form.correct_index,
      explanation: form.explanation.trim() || null,
      academic_session: form.academic_session.trim() || null,
      semester: form.semester.trim() || null,
      institution: form.institution.trim() || null,
      is_free: form.is_free,
      status: form.status,
    };

    setSaving(true);
    try {
      if (editing) {
        await updateQuestion(editing.id, payload);
      } else {
        await createQuestion(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-bg-border shrink-0">
          <div>
            <h3 className="text-base font-bold text-text-primary">
              {editing ? "Edit Question" : "New Question"}
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              {editing
                ? "Update the question details below."
                : "Fill in the question, options, and correct answer."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-bg-tertiary text-text-muted transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Topic
              </label>
              <select
                value={form.topic_id}
                onChange={(e) => update("topic_id", e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-bg-border focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/10 text-sm transition"
              >
                <option value="">No topic</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => update("status", e.target.value as "draft" | "published")}
                className="w-full px-3 py-2.5 rounded-lg border border-bg-border focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/10 text-sm transition"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Question
            </label>
            <textarea
              value={form.question_text}
              onChange={(e) => update("question_text", e.target.value)}
              rows={3}
              placeholder="What is…"
              className="w-full px-3 py-2.5 rounded-lg border border-bg-border focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/10 text-sm resize-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Options — click the circle to mark the correct answer
            </label>
            <div className="space-y-2">
              {(["optA", "optB", "optC", "optD"] as const).map((key, i) => {
                const isCorrect = form.correct_index === i;
                return (
                  <div
                    key={key}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition ${
                      isCorrect
                        ? "border-brand-success bg-brand-success/5"
                        : "border-bg-border hover:border-brand-primary/30"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => update("correct_index", i)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition ${
                        isCorrect
                          ? "bg-brand-success text-white"
                          : "bg-bg-tertiary text-text-secondary hover:bg-bg-border"
                      }`}
                    >
                      {LABELS[i]}
                    </button>
                    <input
                      type="text"
                      value={form[key]}
                      onChange={(e) => update(key, e.target.value)}
                      placeholder={`Option ${LABELS[i]}`}
                      className="flex-1 bg-transparent border-0 focus:outline-none text-sm text-text-primary"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Explanation (optional)
            </label>
            <textarea
              value={form.explanation}
              onChange={(e) => update("explanation", e.target.value)}
              rows={2}
              placeholder="Shown to students after submission"
              className="w-full px-3 py-2.5 rounded-lg border border-bg-border focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/10 text-sm resize-none transition"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Session
              </label>
              <input
                type="text"
                value={form.academic_session}
                onChange={(e) => update("academic_session", e.target.value)}
                placeholder="2022/2023"
                className="w-full px-3 py-2.5 rounded-lg border border-bg-border focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/10 text-sm transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Semester
              </label>
              <input
                type="text"
                value={form.semester}
                onChange={(e) => update("semester", e.target.value)}
                placeholder="2nd"
                className="w-full px-3 py-2.5 rounded-lg border border-bg-border focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/10 text-sm transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Institution
              </label>
              <input
                type="text"
                value={form.institution}
                onChange={(e) => update("institution", e.target.value)}
                placeholder="UNILAG"
                className="w-full px-3 py-2.5 rounded-lg border border-bg-border focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/10 text-sm transition"
              />
            </div>
          </div>

          <div className="flex items-center justify-between bg-bg-tertiary rounded-lg px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-text-primary">Free sample question</div>
              <div className="text-xs text-text-muted">
                Free questions are visible to non-premium students
              </div>
            </div>
            <button
              type="button"
              onClick={() => update("is_free", !form.is_free)}
              className={`relative w-11 h-6 rounded-full transition ${
                form.is_free ? "bg-brand-success" : "bg-bg-border"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                  form.is_free ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}
        </form>

        <div className="px-6 py-4 border-t border-bg-border flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 rounded-lg border border-bg-border text-text-secondary text-sm font-semibold hover:bg-bg-tertiary transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#1A5276] to-[#2E86C1] text-white text-sm font-semibold hover:opacity-95 transition disabled:opacity-60 shadow-sm shadow-blue-500/20"
          >
            {saving ? "Saving…" : editing ? "Update Question" : "Create Question"}
          </button>
        </div>
      </div>
    </div>
  );
}