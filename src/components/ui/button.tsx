import { Button as BaseButton } from "@base-ui/react/button";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ComponentProps<typeof BaseButton> & {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "icon";
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default: "bg-emerald-800 text-white shadow-sm hover:bg-emerald-900",
  outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  destructive: "bg-rose-600 text-white hover:bg-rose-700",
};

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  default: "min-h-11 px-5 py-2.5",
  sm: "min-h-9 px-3 py-2 text-sm",
  icon: "size-10 p-2",
};

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <BaseButton
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
