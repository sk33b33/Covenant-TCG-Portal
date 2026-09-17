import Image from "next/image";
import logoImage from "../../../public/logo.png";
import { cn } from "@/lib/cn";

/**
 * The Covenant crest (public/logo.png) — used as a small badge throughout
 * the site (header, footer, auth screens), always paired with the live
 * <Wordmark/> text next to it rather than relying on the crest's own
 * baked-in lettering to stay legible at small sizes.
 */
export function LogoMark({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={logoImage}
      alt=""
      className={cn("h-8 w-8 shrink-0", className)}
      priority={priority}
    />
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display text-xl tracking-wide text-parchment", className)}>
      Covenant
    </span>
  );
}
