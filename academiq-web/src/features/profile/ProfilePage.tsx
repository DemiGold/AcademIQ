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
  CheckCircle2,
} from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { supabase } from "../../services/supabase";
import { useQuizStore } from "../../stores/quizStore";
import { isPremium, getInitials } from "../../lib/utils";
import Button from "../../components/ui/Button";

function isMatricNo(id: string | null | undefined): boolean {
  if (!id) return false;
  return /^\d{9}$/.test(id);
}

function isJambReg(id: string | null | undefined): boolean {
  if (!id) return false;
  return /^\d{12}[A-Za-z]{2}$/.test(id);
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const [loggingOut, setLoggingOut] = useState(false);

  const [newStudentId, setNewStudentId] = useState("");
  const [updatingId, setUpdatingId] = useState(false);
  const [idFeedback, setIdFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const studentId = profile?.student_id ?? null;
  const isMatric = isMatricNo(studentId);
  const isJamb = isJambReg(studentId);
  const canUpdateToMatric = isJamb;

  const handleUpdateStudentId = async () => {
    if (!newStudentId.trim()) return;
    if (!/^\d{9}$/.test(newStudentId.trim())) {
      setIdFeedback({ type: "error", text: "Matric Number must be exactly 9 digits." });
      return;
    }
    setUpdatingId(true);
    setIdFeedback(null);

    const { error } = await supabase.rpc("update_student_id", { p_new_id: newStudentId.trim() });

    if (error) {
      if (error.code === "23505") {
        setIdFeedback({ type: "error", text: "This Matric Number is already registered to another account." });
      } else {
        setIdFeedback({ type: "error", text: error.message });
      }
    } else {
      setIdFeedback({ type: "success", text: "Matric Number saved! This can no longer be changed." });
      setNewStudentId("");
      await useAuthStore.getState().refreshProfile();
    }
    setUpdatingId(false);
  };

  const handleLogout = async () => {
    if (!window.confirm("Log out of AcademIQ?")) return;
    setLoggingOut(true);
    await signOut();
    useQuizStore.getState().reset();
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
            You are on the free plan. Get a token on the dashboard to unlock all questions.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-bg-border bg-bg-secondary p-4 sm:p-5">
        <h2 className="text-sm font-bold text-text-primary mb-3">
          Academic details
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Hash size={16} className="text-text-muted shrink-0" />
            <span className="text-text-muted">Student ID</span>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-text-primary font-semibold truncate max-w-[140px]">
                {studentId ?? "-"}
              </span>
              {isMatric && (
                <span className="shrink-0 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-brand-success/10 text-brand-success">
                  Matric
                </span>
              )}
              {isJamb && (
                <span className="shrink-0 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  JAMB
                </span>
              )}
            </div>
          </div>

          <Row icon={GraduationCap} label="Faculty" value={profile?.faculty ?? "-"} />
          <Row icon={Building2} label="Department" value={profile?.department ?? "-"} />
          <Row icon={Calendar} label="Academic year" value={profile?.academic_year ?? "-"} />

          {canUpdateToMatric && (
            <div className="mt-4 pt-4 border-t border-bg-border">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={14} className="text-brand-primary" />
                <label className="block text-xs font-semibold text-text-secondary">
                  Got your Matric No.? Update once from JAMB.
                </label>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newStudentId}
                  onChange={(e) =>
                    setNewStudentId(e.target.value.replace(/\D/g, "").slice(0, 9))
                  }
                  placeholder="Enter 9-digit Matric No."
                  inputMode="numeric"
                  className="flex-1 px-3 py-2 rounded-lg border border-bg-border bg-bg-secondary text-text-primary text-sm font-mono focus:outline-none focus:ring-2 focus:border-brand-primary focus:ring-brand-primary/20"
                />
                <Button
                  size="sm"
                  onClick={handleUpdateStudentId}
                  loading={updatingId}
                  disabled={updatingId || newStudentId.length !== 9}
                >
                  Save
                </Button>
              </div>
              <p className="text-[11px] text-text-muted mt-2">
                This can only be done once. After saving, your Matric No. is locked.
              </p>
              {idFeedback && (
                <p className={`text-xs mt-2 font-medium ${idFeedback.type === "success" ? "text-brand-success" : "text-brand-danger"}`}>
                  {idFeedback.text}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-bg-border bg-bg-secondary p-4 sm:p-5">
        <h2 className="text-sm font-bold text-text-primary mb-3">Contact</h2>
        <div className="space-y-3">
          <Row icon={Mail} label="Email" value={user?.email ?? "-"} />
          <Row icon={Phone} label="Phone" value={profile?.phone ?? "-"} />
        </div>
      </div>

      <div className="rounded-xl border border-bg-border bg-bg-secondary p-4 sm:p-5 space-y-3">
        <div className="flex items-start gap-3">
          <ShieldCheck size={16} className="text-text-muted shrink-0 mt-0.5" />
          <p className="text-xs text-text-muted leading-relaxed">
            Need to change your name, phone, or academic details? Reach out on WhatsApp.
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
