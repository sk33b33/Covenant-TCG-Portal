import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Card(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-lg border border-line bg-panel/80 backdrop-blur-sm",
        props.className,
      )}
    />
  );
}
