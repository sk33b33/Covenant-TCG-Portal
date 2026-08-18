/** Joins class name fragments, dropping falsy values. Small enough to not need `clsx`. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
