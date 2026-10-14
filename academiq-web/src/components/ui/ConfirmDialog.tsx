import { AlertTriangle, X } from "lucide-react";
import Button from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={loading ? undefined : onCancel}
    >
      <div
        className="bg-bg-secondary w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 border-t sm:border border-bg-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              tone === "danger"
                ? "bg-brand-danger/10 text-brand-danger"
                : "bg-brand-primary/10 text-brand-primary"
            }`}
          >
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <h3 className="text-base sm:text-lg font-bold text-text-primary">
              {title}
            </h3>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-bg-tertiary text-text-muted transition disabled:opacity-50 shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-text-secondary leading-relaxed mb-6">
          {message}
        </p>

        <div className="flex flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="secondary"
            fullWidth
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            fullWidth
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
