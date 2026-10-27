import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-barbicide text-white hover:bg-barbicide-strong",
  secondary: "border-graphite text-graphite hover:bg-graphite hover:text-white",
  danger: "border-danger text-danger hover:bg-danger hover:text-white",
  ghost: "min-h-10 px-3 text-barbicide hover:bg-barbicide-tint"
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  block?: boolean;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  block = false,
  loading = false,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-transparent px-6 font-semibold transition-colors",
        "focus-visible:rounded-full disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        block && "w-full",
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {children}
    </button>
  );
}
