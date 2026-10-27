import { useId, type InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
}

export function Field({ label, hint, error, optional, id, className, ...inputProps }: FieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [hint && !error && hintId, error && errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("grid gap-2", className)}>
      <label htmlFor={inputId} className="text-sm font-semibold">
        {label} {optional && <span className="font-normal text-steel">(opcional)</span>}
      </label>
      <input
        id={inputId}
        className={cn(
          "min-h-12 w-full rounded-md border-[1.5px] bg-white px-4 transition-colors",
          "hover:border-steel-light focus-visible:border-barbicide focus-visible:ring-offset-0",
          error ? "border-danger" : "border-line"
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...inputProps}
      />
      {hint && !error && (
        <p id={hintId} className="text-sm text-steel">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
