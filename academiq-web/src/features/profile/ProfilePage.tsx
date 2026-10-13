import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Phone,
  Calendar,
  Hash,
  GraduationCap,
  Building2,
  Crown,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { supabase } from "../../services/supabase";
import { isPremium, getInitials } from "../../lib/utils";
import Button from "../../components/ui/Button";

export default function ProfilePage() {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const [loggingOut, setLoggingOut] = useState(false);

  const [newStudentId, setNewStudentId] = useState("");
  const [updatingId, setUpdatingId] = useState(false);
  const [idFeedback, setIdFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleUpdateStudentId = async () => {
    if (!newStudentId.trim()) return;
    setUpdatingId(true);
    setIdFeedback(null);
    
    const { error } = await supabase.rpc("update_student_id", { p_new_id: newStudentId.trim() });
    
    if (error) {
      if (error.code === "23505") {
        setIdFeedback({ type: "error", text: "This Student ID is already registered to another account." });
      } else {
        setIdFeedback({ type: "error", text: error.message });
      }
    } else {
      setIdFeedback({ type: "success", text: "Student ID updated successfully!" });
      setNewStudentId("");
      await useAuthStore.getState().refreshProfile();
    }
    setUpdatingId(false);
  };

  const handleLogout = async () => {
    if (!window.confirm("Log out of AcademIQ?")) return;
    setLoggingOut(true);
    await signOut();
    navigate("/login", { replace: true });
  };

  const premium = isPremium(profile);
  const name = profile?.full_name ?? profile?.username ?? "Student";

  const premiumExpiry = profile?.premium_expires_at
    ? new Date(profile.premium_expires_at).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-5">
      {/* Profile header */}
      <div className="rounded-2xl border border-bg-border bg-bg-secondary p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white font-bold text-xl sm:text-2xl shrink-0 shadow-md">
            {getInitials(name)}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-text-primary truncate">
              {name}
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary truncate mt-0.5">
              {user?.email ?? ""}
            </p>
            {premium && (
              <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-brand-success/10 text-brand-success text-xs font-bold">
                <Crown size={12} />
                Premium
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Premium status */}
      <div className="rounded-xl border border-bg-border bg-bg-secondary p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Crown
            size={16}
            className={premium ? "text-brand-success" : "text-text-muted"}
          />
          <h2 className="text-sm font-bold text-text-primary">
            {premium ? "Premium access" : "Free plan"}
          </h2>
        </div>
        {premium && premiumExpiry ? (
          <p className="text-xs sm:text-sm text-text-secondary">
            Your premium access expires on{" "}
            <strong className="text-text-primary">{premiumExpiry}</strong>.
          </p>
        ) : (
          <p className="text-xs sm:text-sm text-text-secondary">
            You're on the free plan. Get a token on the dashboard to unlock all
            questions.
          </p>
        )}
      </div>

      {/* Academic info */}
      <div className="rounded-xl border border-bg-border bg-bg-secondary p-4 sm:p-5">
        <h2 className="text-sm font-bold text-text-primary mb-3">
          Academic details
        </h2>
        <div className="space-y-3">
          <Row
            icon={Hash}
            label="Student ID"
            value={profile?.student_id ?? "—"}
          />
          <Row
            icon={GraduationCap}
            label="Faculty"
            value={profile?.faculty ?? "—"}
          />
          <Row
            icon={Building2}
            label="Department"
            value={profile?.department ?? "—"}
          />
          <Row
            icon={Calendar}
            label="Academic year"
            value={profile?.academic_year ?? "—"}
          />
        </div>
      </div>

      {/* Contact */}
      <div className="rounded-xl border border-bg-border bg-bg-secondary p-4 sm:p-5">
        <h2 className="text-sm font-bold text-text-primary mb-3">
          Contact
        </h2>
        <div className="space-y-3">
          <Row icon={Mail} label="Email" value={user?.email ?? "—"} />
          <Row icon={Phone} label="Phone" value={profile?.phone ?? "—"} />
        </div>
      </div>

      {/* Actions */}
      <div className="rounded-xl border border-bg-border bg-bg-secondary p-4 sm:p-5 space-y-3">
        <div className="flex items-start gap-3">
          <ShieldCheck size={16} className="text-text-muted shrink-0 mt-0.5" />
          <p className="text-xs text-text-muted leading-relaxed">
            Need to change your name, phone, or academic details? Reach out on
            WhatsApp — profile editing will be self-serve in a future update.
          </p>
        </div>

        <Button
          variant="danger"
          size="lg"
          fullWidth
          onClick={handleLogout}
          loading={loggingOut}
        >
          <LogOut size={16} />
          Log out
        </Button>
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon size={16} className="text-text-muted shrink-0" />
      <span className="text-text-muted">{label}</span>
      <span className="ml-auto text-text-primary font-semibold text-right truncate max-w-[55%]">
        {value}
      </span>
    </div>
  );
}