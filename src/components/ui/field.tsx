import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function FieldGroup({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("space-y-5", className)} {...props} />;
}

export function Field({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

type FieldLabelProps = ComponentProps<"label"> & { htmlFor: string };

export function FieldLabel({
  children,
  className,
  htmlFor,
  ...props
}: FieldLabelProps) {
  return (
    <label
      className={cn("block text-sm font-semibold text-slate-700", className)}
      htmlFor={htmlFor}
      {...props}
    >
      {children}
    </label>
  );
}

export function FieldError({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn("block text-sm font-medium text-rose-600", className)}
      role="alert"
      {...props}
    />
  );
}
