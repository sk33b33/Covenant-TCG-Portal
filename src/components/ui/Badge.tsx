import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type BadgeTone = "gold" | "arcane" | "success" | "danger" | "neutral";

const toneClasses: Record<BadgeTone, string> = {
  gold: "bg-gold/10 text-gold-bright border-gold/30",
  arcane: "bg-arcane/10 text-arcane border-arcane/30",
  success: "bg-success-soft text-success border-success/30",
  danger: "bg-danger-soft text-danger border-danger/40",
  neutral: "bg-panel-2 text-muted border-line",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide",
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}
