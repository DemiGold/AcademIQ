import { useState, useRef, type FormEvent } from "react";
import { X, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "../../services/supabase";
import type { TopicOption } from "../../services/adminService";

interface ParsedRow {
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
  topic_name: string;
  topic_id: string | null;
  errors: string[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  courseId: string;
  topics: TopicOption[];
}

const REQUIRED_COLUMNS = [
  "question_text",
  "optA",
  "optB",
  "optC",
  "optD",
  "correct_index",
];

const SAMPLE_CSV = `question_text,optA,optB,optC,optD,correct_index,explanation,academic_session,semester,institution,is_free,status,topic_name
"What is the capital of Nigeria?","Lagos","Abuja","Kano","Ibadan",1,"Abuja became the capital in 1991.","2022/2023","2nd","UNILAG",true,"published","Integration"
"What is 5 × 6?","11","25","30","36",2,"5 × 6 = 30.","2022/2023","2nd","UNILAG",false,"published","Integration"
`;

export default function BulkUploadModal({
  open,
  onClose,
  onSaved,
  courseId,
  topics,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!open) return null;

  const reset = () => {
    setRows([]);
    setFileError(null);
    setSaveError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result.map((s) => s.trim());
  };

  const handleFile = async (file: File) => {
    setFileError(null);
    setRows([]);

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      setFileError("File must have a header row and at least one data row.");
      return;
    }

    const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
    const missing = REQUIRED_COLUMNS.filter((c) => !header.includes(c));
    if (missing.length) {
      setFileError(`Missing required columns: ${missing.join(", ")}`);
      return;
    }

    const idx = (col: string) => header.indexOf(col);

    const parsed: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = parseCsvLine(lines[i]);
      const get = (col: string) => {
        const j = idx(col);
        return j >= 0 ? (cells[j] ?? "").trim() : "";
      };

      const question_text = get("question_text");
      const optA = get("optA");
      const optB = get("optB");
      const optC = get("optC");
      const optD = get("optD");
      const ciRaw = get("correct_index");
      const ci = parseInt(ciRaw, 10);

      const rowErrors: string[] = [];
      if (!question_text) rowErrors.push("empty question");
      if (!optA || !optB || !optC || !optD) rowErrors.push("missing option");
      if (isNaN(ci) || ci < 0 || ci > 3) rowErrors.push("correct_index must be 0–3");

      const isFreeRaw = get("is_free").toLowerCase();
      const is_free = ["true", "1", "yes", "y"].includes(isFreeRaw);

      const statusRaw = get("status").toLowerCase();
      const status: "draft" | "published" =
        statusRaw === "published" ? "published" : "draft";

      const topicName = get("topic_name");
      const matchedTopic = topicName
        ? topics.find((t) => t.name.toLowerCase() === topicName.toLowerCase())
        : null;

      if (topicName && !matchedTopic) {
        rowErrors.push(`topic "${topicName}" not found`);
      }

      parsed.push({
        question_text,
        optA,
        optB,
        optC,
        optD,
        correct_index: ci,
        explanation: get("explanation"),
        academic_session: get("academic_session"),
        semester: get("semester"),
        institution: get("institution") || "UNILAG",
        is_free,
        status,
        topic_name: topicName,
        topic_id: matchedTopic?.id ?? null,
        errors: rowErrors,
      });
    }

    setRows(parsed);
  };

  const validRows = rows.filter((r) => r.errors.length === 0);
  const invalidRows = rows.filter((r) => r.errors.length > 0);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (validRows.length === 0) return;

    setSaving(true);
    setSaveError(null);

    const payload = validRows.map((r) => ({
      course_id: courseId,
      topic_id: r.topic_id,
      question_text: r.question_text,
      options: [r.optA, r.optB, r.optC, r.optD],
      correct_index: r.correct_index,
      explanation: r.explanation || null,
      academic_session: r.academic_session || null,
      semester: r.semester || null,
      institution: r.institution || null,
      is_free: r.is_free,
      status: r.status,
    }));

    try {
      const { error } = await supabase.from("questions").insert(payload);
      if (error) throw new Error(error.message);
      onSaved();
      handleClose();
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "academiq-questions-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-bg-border shrink-0">
          <div>
            <h3 className="text-base font-bold text-text-primary">Bulk Upload Questions</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Upload a CSV file to add many questions at once.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-bg-tertiary text-text-muted transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="bg-bg-tertiary rounded-xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0">
              <FileSpreadsheet size={18} className="text-brand-primary" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-text-primary">
                First time? Download the template
              </div>
              <div className="text-xs text-text-secondary mt-1">
                Required: <code className="bg-white px-1 rounded">question_text, optA, optB, optC, optD, correct_index</code>
                . Optional: <code className="bg-white px-1 rounded">explanation, topic_name, is_free, status, semester, academic_session, institution</code>
              </div>
              <button
                onClick={downloadSample}
                className="mt-3 px-3 py-1.5 rounded-lg bg-white border border-bg-border text-xs font-semibold text-text-primary hover:bg-bg-primary transition"
              >
                Download CSV template
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              CSV File
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
              className="block w-full text-sm text-text-secondary file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:bg-brand-primary file:text-white file:font-semibold file:cursor-pointer hover:file:opacity-90"
            />
            {fileError && (
              <div className="mt-2 flex items-center gap-2 text-xs text-red-600">
                <AlertCircle size={14} /> {fileError}
              </div>
            )}
          </div>

          {rows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-brand-success">
                  <CheckCircle2 size={14} /> {validRows.length} valid
                </div>
                {invalidRows.length > 0 && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-red-600">
                    <AlertCircle size={14} /> {invalidRows.length} with issues
                  </div>
                )}
              </div>

              <div className="border border-bg-border rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-bg-tertiary sticky top-0">
                    <tr className="text-left text-text-muted uppercase tracking-wider">
                      <th className="px-3 py-2 w-10">#</th>
                      <th className="px-3 py-2">Question</th>
                      <th className="px-3 py-2 w-24">Answer</th>
                      <th className="px-3 py-2 w-32">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr
                        key={i}
                        className={`border-t border-bg-border ${
                          r.errors.length ? "bg-red-50/50" : ""
                        }`}
                      >
                        <td className="px-3 py-2 text-text-muted">{i + 1}</td>
                        <td className="px-3 py-2">
                          <div className="text-text-primary line-clamp-1">
                            {r.question_text || "(empty)"}
                          </div>
                          {r.errors.length > 0 && (
                            <div className="text-red-600 mt-0.5">
                              {r.errors.join(", ")}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-text-secondary">
                          {["A", "B", "C", "D"][r.correct_index] ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-text-muted">
                          {r.is_free && (
                            <span className="inline-flex px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold mr-1">
                              FREE
                            </span>
                          )}
                          {r.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {invalidRows.length > 0 && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  Rows with issues will be skipped. Fix them in the CSV and re-upload for a clean import.
                </div>
              )}
            </div>
          )}

          {saveError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {saveError}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-bg-border flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="px-4 py-2.5 rounded-lg border border-bg-border text-text-secondary text-sm font-semibold hover:bg-bg-tertiary transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || validRows.length === 0}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#1A5276] to-[#2E86C1] text-white text-sm font-semibold hover:opacity-95 transition disabled:opacity-50 shadow-sm shadow-blue-500/20"
          >
            {saving
              ? "Uploading…"
              : validRows.length > 0
              ? `Upload ${validRows.length} Question${validRows.length === 1 ? "" : "s"}`
              : "No valid rows"}
          </button>
        </div>
      </div>
    </div>
  );
}