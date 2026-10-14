import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowLeft, Check } from "lucide-react";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "../../../lib/validation";
import { requestPasswordReset } from "../../../services/authService";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import FormField from "../../../components/ui/FormField";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setServerError(null);
    const { error } = await requestPasswordReset(data.email);
    if (error) {
      setServerError(error.message);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-brand-success/10 flex items-center justify-center mx-auto mb-5">
            <Check size={28} className="text-brand-success" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Email sent</h1>
          <p className="text-sm text-text-secondary mt-3 leading-relaxed">
            If an account exists for that email, we've sent a password reset
            link. Check your inbox (and spam).
          </p>
          <Link to="/login">
            <Button variant="secondary" size="lg" fullWidth className="mt-6">
              <ArrowLeft size={16} /> Back to login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
            Reset your password
          </h1>
          <p className="text-sm text-text-secondary mt-2">
            Enter your email and we'll send you a reset link.
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

            {serverError && (
              <div className="bg-brand-danger/10 border border-brand-danger/30 text-brand-danger text-sm rounded-lg px-4 py-3">
                {serverError}
              </div>
            )}

            <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
              Send reset link
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-text-secondary mt-6">
          Remembered it?{" "}
          <Link to="/login" className="font-semibold text-brand-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}