import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Check, AlertCircle } from "lucide-react";
import { resetPasswordSchema, type ResetPasswordInput } from "../../../lib/validation";
import { updatePassword } from "../../../services/authService";
import { supabase } from "../../../services/supabase";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import FormField from "../../../components/ui/FormField";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase puts a token in the URL hash; SDK picks it up automatically.
  // We wait for the session to be available before allowing password change.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessionReady(true);
    });
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirm_password: "" },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setServerError(null);
    const { error } = await updatePassword(data.password);
    if (error) {
      setServerError(error.message);
      return;
    }
    setSuccess(true);
    setTimeout(() => navigate("/dashboard", { replace: true }), 1800);
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-brand-success/10 flex items-center justify-center mx-auto mb-5">
            <Check size={28} className="text-brand-success" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Password updated</h1>
          <p className="text-sm text-text-secondary mt-3">
            Redirecting you to your dashboard…
          </p>
        </div>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-brand-warning/10 flex items-center justify-center mx-auto mb-5">
            <AlertCircle size={28} className="text-brand-warning" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Link expired</h1>
          <p className="text-sm text-text-secondary mt-3 leading-relaxed">
            This password reset link is invalid or has expired. Request a new one
            from the login page.
          </p>
          <Button
            size="lg"
            fullWidth
            onClick={() => navigate("/forgot-password")}
            className="mt-6"
          >
            Request new link
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
            Set a new password
          </h1>
          <p className="text-sm text-text-secondary mt-2">
            Choose something strong and memorable.
          </p>
        </div>

        <div className="bg-bg-secondary rounded-2xl border border-bg-border p-5 sm:p-7 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              label="New Password"
              error={errors.password?.message}
              hint="At least 8 characters"
              required
            >
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                error={!!errors.password}
                disabled={isSubmitting}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="p-2 rounded-md text-text-muted hover:text-text-primary transition"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                {...register("password")}
              />
            </FormField>

            <FormField
              label="Confirm Password"
              error={errors.confirm_password?.message}
              required
            >
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                error={!!errors.confirm_password}
                disabled={isSubmitting}
                {...register("confirm_password")}
              />
            </FormField>

            {serverError && (
              <div className="bg-brand-danger/10 border border-brand-danger/30 text-brand-danger text-sm rounded-lg px-4 py-3">
                {serverError}
              </div>
            )}

            <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
              Update password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}