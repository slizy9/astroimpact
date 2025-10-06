import { clsx, type ClassValue } from "clsx";

// Lightweight className combiner. We intentionally avoid adding `tailwind-merge`
// as a dependency here to keep builds simple; if you want the full
// Tailwind class merging semantics install `tailwind-merge` and revert to
// `twMerge(clsx(inputs))`.
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
