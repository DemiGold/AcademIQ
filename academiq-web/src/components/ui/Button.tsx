import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { classNames } from "../../lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand-primary text-white hover:opacity-90 active:opacity-95 shadow-sm shadow-brand-primary/20",
  secondary:
    "bg-bg-tertiary text-text-primary border border-bg-border hover:bg-bg-secondary",
  ghost:
    "bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-text-primary",
  danger:
    "bg-brand-danger text-white hover:opacity-90 shadow-sm shadow-brand-danger/20",
};

const SIZES: Record<Size, string> = {
  sm: "text-sm px-3 py-2 min-h-[40px]",
  md: "text-sm sm:text-base px-4 py-2.5 min-h-[48px]",
  lg: "text-base px-6 py-3 min-h-[52px]",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      className,
      children,
      disabled,
      ...rest
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={classNames(
          "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition select-none",
          "focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:ring-offset-0",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          VARIANTS[variant],
          SIZES[size],
          fullWidth ? "w-full" : "",
          className
        )}
        {...rest}
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;