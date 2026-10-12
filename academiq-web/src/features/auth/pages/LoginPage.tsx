import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { loginSchema, type LoginInput } from "../../../lib/validation";
import { signIn } from "../../../services/authService";
import { useAuthStore } from "../../../stores/authStore";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import FormField from "../../../components/ui/FormField";

export default function LoginPage() {
  const navigate = useNavigate();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    const { error } = await signIn(data.email, data.password);
    if (error) {
      if (error.message.toLowerCase().includes("invalid")) {
        setServerError("Incorrect email or password.");
      } else {
        setServerError(error.message);
      }
      return;
    }
    await refreshProfile();
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
            Welcome back
          </h1>
          <p className="text-sm text-text-secondary mt-2">
            Sign in to continue practicing.
          </p>
        </div>

        <div className="bg-bg-secondary rounded-2xl border border-bg-border p-5 sm:p-7 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Email" error={errors.email?.message} required>
              <Input
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                leftIcon={<Mail size={16} />}
                error={!!errors.email}
                disabled={isSubmitting}
                {...register("email")}
              />
            </FormField>

            <FormField label="Password" error={errors.password?.message} required>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                leftIcon={<Lock size={16} />}
                error={!!errors.password}
                disabled={isSubmitting}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="p-2 rounded-md text-text-muted hover:text-text-primary transition"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                {...register("password")}
              />
            </FormField>

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-brand-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {serverError && (
              <div className="bg-brand-danger/10 border border-brand-danger/30 text-brand-danger text-sm rounded-lg px-4 py-3">
                {serverError}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Sign in
              {!isSubmitting && <ArrowRight size={16} />}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-text-secondary mt-6">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-brand-primary hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}