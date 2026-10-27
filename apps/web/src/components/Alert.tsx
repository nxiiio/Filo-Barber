import type { ReactNode } from "react";
import { cn } from "../lib/cn";

type Tone = "error" | "success" | "info";

const TONES: Record<Tone, string> = {
  error: "border-danger bg-leather-tint text-[#6e1820]",
  success: "border-success bg-success-tint text-[#164d32]",
  info: "border-barbicide bg-barbicide-tint text-barbicide-strong"
};

export function Alert({ tone = "error", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <div
      className={cn("rounded-r-md border-l-4 px-4 py-3 text-sm font-medium", TONES[tone])}
      role={tone === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
