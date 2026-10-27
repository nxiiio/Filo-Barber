import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "../../components/Button";
import { formatClp } from "../../lib/format";

interface StepFrameProps {
  title: string;
  description?: string;
  children: ReactNode;
  onBack?: () => void;
  primaryLabel: string;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  onPrimary?: () => void;
  formId?: string;
  totalClp?: number;
  focusOnMount?: boolean;
}

export function StepFrame({
  title,
  description,
  children,
  onBack,
  primaryLabel,
  primaryDisabled,
  primaryLoading,
  onPrimary,
  formId,
  totalClp,
  focusOnMount = true
}: StepFrameProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (focusOnMount) headingRef.current?.focus({ preventScroll: true });
  }, [focusOnMount]);

  return (
    <section aria-labelledby="step-title" className="grid gap-6">
      <header className="grid gap-2">
        <h2 id="step-title" ref={headingRef} tabIndex={-1} className="text-5xl focus-visible:ring-0">
          {title}
        </h2>
        {description && <p className="max-w-prose text-steel">{description}</p>}
      </header>

      {children}

      <div className="sticky bottom-0 -mx-5 flex items-center gap-3 border-t border-line bg-porcelain/95 px-5 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
        {totalClp !== undefined && (
          <p className="mr-auto grid leading-tight lg:hidden">
            <span className="text-xs text-steel">Total</span>
            <strong className="tabular-nums">{formatClp(totalClp)}</strong>
          </p>
        )}
        {onBack && (
          <Button variant="ghost" onClick={onBack} className="sm:mr-auto">
            Volver
          </Button>
        )}
        <Button
          type={formId ? "submit" : "button"}
          form={formId}
          onClick={onPrimary}
          disabled={primaryDisabled}
          loading={primaryLoading}
          className="ml-auto sm:ml-0"
        >
          {primaryLabel}
        </Button>
      </div>
    </section>
  );
}
