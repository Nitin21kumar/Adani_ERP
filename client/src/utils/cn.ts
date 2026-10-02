import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely (used by every shadcn-style UI primitive). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
