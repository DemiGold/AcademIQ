import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: "brand" | "success" | "danger" | "warning" | "muted";
}

const ACCENT_COLORS: Record<string, string> = {
  brand: "bg-blue-50 text-brand-primary",
  success: "bg-green-50 text-green-600",
  danger: "bg-red-50 text-red-600",
  warning: "bg-amber-50 text-amber-600",
  muted: "bg-gray-100 text-gray-600",
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  accent = "brand",
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-bg-border p-5 hover:shadow-sm transition">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">
          {label}
        </span>
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${ACCENT_COLORS[accent]}`}
        >
          <Icon size={18} />
        </div>
      </div>
      <div className="mt-3 text-2xl font-bold text-text-primary">{value}</div>
    </div>
  );
}