import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff } from "lucide-react";
import {
  registerStep1Schema,
  registerStep2Schema,
  registerStep3Schema,
  type RegisterStep1Input,
  type RegisterStep2Input,
  type RegisterStep3Input,
} from "../../../lib/validation";
import { FACULTIES, DEPARTMENTS, ACADEMIC_YEARS, type FacultyName } from "../../../lib/constants";
import { signUp } from "../../../services/authService";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import FormField from "../../../components/ui/FormField";
import { classNames } from "../../../lib/utils";

const STEPS = ["Personal", "Academic", "Password"] as const;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [step1, setStep1] = useState<RegisterStep1Input | null>(null);
  const [step2, setStep2] = useState<RegisterStep2Input | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleStep1 = (data: RegisterStep1Input) => {
    setStep1(data);
    setStep(1);
  };

  const handleStep2 = (data: RegisterStep2Input) => {
    setStep2(data);
    setStep(2);
  };

  const handleStep3 = async (data: RegisterStep3Input) => {
    if (!step1 || !step2) return;
    setServerError(null);

    const { error } = await signUp({
      email: step1.email,
      password: data.password,
      full_name: step1.full_name,
      phone: step1.phone,
      dob: step1.dob,
      student_id: step2.student_id,
      faculty: step2.faculty,
      department: step2.department,
      academic_year: step2.academic_year,
    });

    if (error) {
      if (error.message.toLowerCase().includes("already")) {
        setServerError("An account with this email already exists.");
      } else {
        setServerError(error.message);
      }
      return;
    }

    setSuccess(true);
  };

  if (success) {
    return <SuccessScreen onGoToLogin={() => navigate("/login")} />;
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] flex items-start sm:items-center justify-center px-4 py-8 sm:py-16">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
            Create your account
          </h1>
          <p className="text-sm text-text-secondary mt-2">
            Join hundreds of UNILAG students.
          </p>
        </div>

        <StepIndicator current={step} />

        <div className="bg-bg-secondary rounded-2xl border border-bg-border p-5 sm:p-7 shadow-sm mt-5">
          {step === 0 && <Step1Form onNext={handleStep1} defaultValues={step1} />}
          {step === 1 && (
            <Step2Form
              onNext={handleStep2}
              onBack={() => setStep(0)}
              defaultValues={step2}
            />
          )}
          {step === 2 && (
            <Step3Form
              onBack={() => setStep(1)}
              onSubmit={handleStep3}
              serverError={serverError}
            />
          )}
        </div>

        <p className="text-center text-sm text-text-secondary mt-6">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-between max-w-md mx-auto">
      {STEPS.map((label, i) => {
        const isDone = i < current;
        const isActive = i === current;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
              <div
                className={classNames(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition",
                  isDone
                    ? "bg-brand-success text-white"
                    : isActive
                    ? "bg-brand-primary text-white"
                    : "bg-bg-tertiary text-text-muted border border-bg-border"
                )}
              >
                {isDone ? <Check size={14} /> : i + 1}
              </div>
              <span
                className={classNames(
                  "text-[11px] font-semibold",
                  isActive || isDone ? "text-text-primary" : "text-text-muted"
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 mb-5 bg-bg-border overflow-hidden">
                <div
                  className={classNames(
                    "h-full transition-all",
                    isDone ? "w-full bg-brand-success" : "w-0"
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Step1Form({
  onNext,
  defaultValues,
}: {
  onNext: (d: RegisterStep1Input) => void;
  defaultValues: RegisterStep1Input | null;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterStep1Input>({
    resolver: zodResolver(registerStep1Schema),
    defaultValues: defaultValues ?? {
      full_name: "",
      email: "",
      phone: "",
      dob: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <h2 className="text-lg font-bold text-text-primary">Personal info</h2>
      <p className="text-sm text-text-secondary -mt-2 mb-2">
        Tell us about yourself.
      </p>

      <FormField label="Full Name" error={errors.full_name?.message} required>
        <Input
          placeholder="Ada Okafor"
          autoComplete="name"
          error={!!errors.full_name}
          {...register("full_name")}
        />
      </FormField>

      <FormField label="Email" error={errors.email?.message} required>
        <Input
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          error={!!errors.email}
          {...register("email")}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Phone" error={errors.phone?.message} required>
          <Input
            type="tel"
            inputMode="tel"
            placeholder="080 1234 5678"
            autoComplete="tel"
            error={!!errors.phone}
            {...register("phone")}
          />
        </FormField>

        <FormField label="Date of Birth" error={errors.dob?.message} required>
          <Input
            type="date"
            autoComplete="bday"
            error={!!errors.dob}
            {...register("dob")}
          />
        </FormField>
      </div>

      <Button type="submit" size="lg" fullWidth>
        Continue <ArrowRight size={16} />
      </Button>
    </form>
  );
}

function Step2Form({
  onNext,
  onBack,
  defaultValues,
}: {
  onNext: (d: RegisterStep2Input) => void;
  onBack: () => void;
  defaultValues: RegisterStep2Input | null;
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterStep2Input>({
    resolver: zodResolver(registerStep2Schema),
    defaultValues: defaultValues ?? {
      student_id: "",
      faculty: "Science" as FacultyName,
      department: "",
      academic_year: "Year 1",
    },
  });

  const faculty = watch("faculty");
  const departments = faculty ? DEPARTMENTS[faculty as FacultyName] ?? [] : [];

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <h2 className="text-lg font-bold text-text-primary">Academic info</h2>
      <p className="text-sm text-text-secondary -mt-2 mb-2">
        Your academic details.
      </p>

      <FormField label="Student ID" error={errors.student_id?.message} required>
        <Input
          placeholder="240801001"
          error={!!errors.student_id}
          {...register("student_id")}
        />
      </FormField>

      <FormField label="Faculty" error={errors.faculty?.message} required>
        <select
          {...register("faculty")}
          className={classNames(
            "w-full rounded-lg border bg-bg-secondary text-text-primary",
            "text-base py-2.5 px-3 transition focus:outline-none focus:ring-2",
            errors.faculty
              ? "border-brand-danger focus:border-brand-danger focus:ring-brand-danger/20"
              : "border-bg-border focus:border-brand-primary focus:ring-brand-primary/20"
          )}
        >
          {FACULTIES.map((f) => (
            <option key={f} value={f}>
              Faculty of {f}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Department" error={errors.department?.message} required>
        <select
          {...register("department")}
          className={classNames(
            "w-full rounded-lg border bg-bg-secondary text-text-primary",
            "text-base py-2.5 px-3 transition focus:outline-none focus:ring-2",
            errors.department
              ? "border-brand-danger focus:border-brand-danger focus:ring-brand-danger/20"
              : "border-bg-border focus:border-brand-primary focus:ring-brand-primary/20"
          )}
        >
          <option value="">Choose your department</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Academic Year" error={errors.academic_year?.message} required>
        <select
          {...register("academic_year")}
          className={classNames(
            "w-full rounded-lg border bg-bg-secondary text-text-primary",
            "text-base py-2.5 px-3 transition focus:outline-none focus:ring-2",
            errors.academic_year
              ? "border-brand-danger focus:border-brand-danger focus:ring-brand-danger/20"
              : "border-bg-border focus:border-brand-primary focus:ring-brand-primary/20"
          )}
        >
          {ACADEMIC_YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </FormField>

      <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
        <Button type="button" variant="secondary" size="lg" onClick={onBack} fullWidth>
          <ArrowLeft size={16} /> Back
        </Button>
        <Button type="submit" size="lg" fullWidth>
          Continue <ArrowRight size={16} />
        </Button>
      </div>
    </form>
  );
}

function Step3Form({
  onBack,
  onSubmit,
  serverError,
}: {
  onBack: () => void;
  onSubmit: (d: RegisterStep3Input) => void;
  serverError: string | null;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterStep3Input>({
    resolver: zodResolver(registerStep3Schema),
    defaultValues: { password: "", confirm_password: "" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-lg font-bold text-text-primary">Set a password</h2>
      <p className="text-sm text-text-secondary -mt-2 mb-2">
        Choose something strong.
      </p>

      <FormField
        label="Password"
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

      <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={onBack}
          disabled={isSubmitting}
          fullWidth
        >
          <ArrowLeft size={16} /> Back
        </Button>
        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          Create account
        </Button>
      </div>
    </form>
  );
}

function SuccessScreen({ onGoToLogin }: { onGoToLogin: () => void }) {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-brand-success/10 flex items-center justify-center mx-auto mb-5">
          <Check size={28} className="text-brand-success" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary">Check your email</h1>
        <p className="text-sm text-text-secondary mt-3 leading-relaxed">
          We sent a confirmation link to your inbox. Click it to activate your
          account, then come back and log in.
        </p>
        <Button size="lg" fullWidth onClick={onGoToLogin} className="mt-6">
          Go to login
        </Button>
        <p className="text-xs text-text-muted mt-4">
          Didn't get the email? Check spam, or wait 1 minute and try logging in.
        </p>
      </div>
    </div>
  );
}