import { useState, useEffect, type FormEvent } from "react";
import { X } from "lucide-react";
import {
  createCourse,
  updateCourse,
  type CourseRow,
} from "../../services/adminService";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing: CourseRow | null;
}

export default function CourseFormModal({ open, onClose, onSaved, editing }: Props) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setCode(editing.code);
      setName(editing.name);
    } else {
      setCode("");
      setName("");
    }
    setError(null);
  }, [open, editing]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();

    if (!cleanCode) return setError("Course code is required.");
    if (!/^[A-Z]{2,4}\d{3}$/.test(cleanCode))
      return setError("Code format looks off. Expected like MTH102, GST112.");
    if (!cleanName) return setError("Course name is required.");

    setSaving(true);
    try {
      if (editing) {
        await updateCourse(editing.id, { code: cleanCode, name: cleanName });
      } else {
        await createCourse(cleanCode, cleanName);
      }
      onSaved();
      onClose();
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes("duplicate key") || msg.includes("unique")) {
        setError(`Course code "${cleanCode}" already exists.`);
      } else {
        setError(msg);
      }
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-bg-border">
          <div>
            <h3 className="text-base font-bold text-text-primary">
              {editing ? "Edit Course" : "New Course"}
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              {editing
                ? "Update course details below."
                : "Add a new course to the platform."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-bg-tertiary text-text-muted transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Course Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="MTH102"
              maxLength={10}
              className="w-full px-3 py-2.5 rounded-lg border border-bg-border focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/10 text-sm transition font-mono uppercase"
            />
            <p className="text-[11px] text-text-muted mt-1">
              Format: 2–4 letters + 3 digits. Example: <code>MTH102</code>, <code>GST112</code>.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Course Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Elementary Mathematics II"
              className="w-full px-3 py-2.5 rounded-lg border border-bg-border focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/10 text-sm transition"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
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
              disabled={saving}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#1A5276] to-[#2E86C1] text-white text-sm font-semibold hover:opacity-95 transition disabled:opacity-60 shadow-sm shadow-blue-500/20"
            >
              {saving ? "Saving…" : editing ? "Update Course" : "Create Course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}