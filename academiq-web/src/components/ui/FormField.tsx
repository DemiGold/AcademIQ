import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  required?: boolean;
}

export default function FormField({
  label,
  error,
  hint,
  children,
  required,
}: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs sm:text-sm font-semibold text-text-secondary">
        {label}
        {required && <span className="text-brand-danger ml-0.5">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-brand-danger font-medium">{error}</p>
      ) : hint ? (
        <p className="text-xs text-text-muted">{hint}</p>
      ) : null}
    </div>
  );
}