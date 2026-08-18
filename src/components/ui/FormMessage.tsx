import { cn } from "@/lib/cn";

export function FormMessage({ status, message }: { status: "error" | "success"; message?: string }) {
  if (!message) return null;
  return (
    <p
      role={status === "error" ? "alert" : "status"}
      className={cn(
        "mb-5 rounded-md border px-3.5 py-2.5 text-sm",
        status === "error"
          ? "border-danger/40 bg-danger-soft text-danger"
          : "border-success/40 bg-success-soft text-success",
      )}
    >
      {message}
    </p>
  );
}
