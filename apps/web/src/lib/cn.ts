import { extendTailwindMerge } from "tailwind-merge";

const merge = extendTailwindMerge({
  extend: {
    theme: { text: ["sign"] }
  }
});

export function cn(...classes: (string | false | null | undefined)[]): string {
  return merge(classes.filter(Boolean).join(" "));
}
