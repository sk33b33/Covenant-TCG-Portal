import type { ReactNode } from "react";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-3 py-16 text-muted">
      <span
        className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-gold"
        aria-hidden="true"
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line py-16 px-6 text-center">
      <h3 className="font-display text-lg text-parchment">{title}</h3>
      {description ? <p className="max-w-sm text-sm text-muted">{description}</p> : null}
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "Please try again in a moment.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-2 rounded-lg border border-danger/30 bg-danger-soft/40 py-16 px-6 text-center"
    >
      <h3 className="font-display text-lg text-parchment">{title}</h3>
      <p className="max-w-sm text-sm text-muted">{description}</p>
    </div>
  );
}
