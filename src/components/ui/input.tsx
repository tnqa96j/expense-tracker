import { Input as BaseInput } from "@base-ui/react/input";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: ComponentProps<typeof BaseInput>) {
  return (
    <BaseInput
      className={cn(
        "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus-visible:border-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-700/15 disabled:cursor-not-allowed disabled:bg-slate-100",
        className,
      )}
      {...props}
    />
  );
}
