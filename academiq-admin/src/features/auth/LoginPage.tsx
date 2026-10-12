import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";
import { supabase } from "../../services/supabase";
import { useAuthStore } from "../../stores/authStore";

export default function LoginPage() {
  const navigate = useNavigate();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError("Sign in failed. Please try again.");
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile || profile.role !== "super_admin") {
        await supabase.auth.signOut();
        setError("Access denied. This account is not authorized for the admin panel.");
        setLoading(false);
        return;
      }

      await refreshProfile();
      navigate("/overview", { replace: true });
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* ============================================
          LEFT: Branding Panel (hidden on mobile)
         ============================================ */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#0A1628] via-[#1A5276] to-[#2E86C1]">
        {/* Decorative blur circles */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#2E86C1] opacity-20 blur-3xl" />
        <div className="absolute bottom-0 -right-32 w-96 h-96 rounded-full bg-[#F39C12] opacity-10 blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full bg-[#2ECC71] opacity-10 blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Top: logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <GraduationCap size={22} className="text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-lg leading-none">AcademIQ</div>
              <div className="text-white/60 text-xs mt-1 tracking-widest uppercase">
                Admin Console
              </div>
            </div>
          </div>

          {/* Middle: hero copy */}
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Run the platform
              <br />
              <span className="bg-gradient-to-r from-[#2ECC71] to-[#F39C12] bg-clip-text text-transparent">
                like a pro.
              </span>
            </h1>
            <p className="text-white/70 text-base leading-relaxed max-w-sm">
              Manage courses, curate questions, sell premium tokens, and watch student
              performance — all from one clean dashboard.
            </p>

            {/* Feature bullets */}
            <div className="mt-8 space-y-3">
              {[
                "Full course & question bank control",
                "Real-time premium token analytics",
                "Student performance tracking",
              ].map((line) => (
                <div key={line} className="flex items-center gap-3 text-white/80 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2ECC71]" />
                  {line}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom: footer */}
          <div className="text-white/40 text-xs">
            © {new Date().getFullYear()} AcademIQ. Built for UNILAG students.
          </div>
        </div>
      </div>

      {/* ============================================
          RIGHT: Login Form
         ============================================ */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-bg-primary">
        <div className="w-full max-w-sm">
          {/* Mobile-only brand */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#1A5276] to-[#2E86C1] flex items-center justify-center shadow-lg shadow-blue-500/20">
              <GraduationCap size={22} className="text-white" />
            </div>
            <div>
              <div className="text-text-primary font-bold text-lg leading-none">
                AcademIQ
              </div>
              <div className="text-text-muted text-xs mt-1 tracking-widest uppercase">
                Admin
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary">Welcome back</h2>
            <p className="text-sm text-text-secondary mt-2">
              Sign in to access the admin panel.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-bg-border bg-white text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-4 focus:ring-brand-primary/10 transition disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-text-secondary">
                  Password
                </label>
                <button
                  type="button"
                  tabIndex={-1}
                  className="text-xs font-semibold text-brand-primary hover:underline"
                  onClick={() =>
                    setError(
                      "Password reset must be done via Supabase Dashboard for now."
                    )
                  }
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-bg-border bg-white text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-4 focus:ring-brand-primary/10 transition disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-bg-tertiary text-text-muted transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-4 py-3">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="group w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#1A5276] to-[#2E86C1] text-white font-semibold py-3.5 rounded-xl hover:opacity-95 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-blue-500/20"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="text-center text-xs text-text-muted mt-8">
            Access restricted to super administrators.
          </p>
        </div>
      </div>
    </div>
  );
}