import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { classNames } from "../../lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, leftIcon, rightSlot, className, ...rest }, ref) => {
    const hasLeft = !!leftIcon;
    const hasRight = !!rightSlot;

    return (
      <div className="relative w-full">
        {hasLeft && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={classNames(
            "w-full rounded-lg border bg-bg-secondary text-text-primary placeholder:text-text-muted",
            "transition focus:outline-none focus:ring-2",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            "text-base py-2.5 px-3",
            hasLeft ? "pl-10" : "",
            hasRight ? "pr-11" : "",
            error
              ? "border-brand-danger focus:border-brand-danger focus:ring-brand-danger/20"
              : "border-bg-border focus:border-brand-primary focus:ring-brand-primary/20",
            className
          )}
          {...rest}
        />
        {hasRight && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
            {rightSlot}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;