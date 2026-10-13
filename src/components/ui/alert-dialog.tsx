import { AlertDialog } from "@base-ui/react/alert-dialog";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const AlertDialogRoot = AlertDialog.Root;

export function AlertDialogContent({
  className,
  ...props
}: ComponentProps<typeof AlertDialog.Popup>) {
  return (
    <AlertDialog.Portal>
      <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm" />
      <AlertDialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <AlertDialog.Popup
          className={cn(
            "w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl outline-none",
            className,
          )}
          {...props}
        />
      </AlertDialog.Viewport>
    </AlertDialog.Portal>
  );
}

export function AlertDialogTitle({
  className,
  ...props
}: ComponentProps<typeof AlertDialog.Title>) {
  return (
    <AlertDialog.Title
      className={cn(
        "text-xl font-bold tracking-tight text-slate-900",
        className,
      )}
      {...props}
    />
  );
}

export function AlertDialogDescription({
  className,
  ...props
}: ComponentProps<typeof AlertDialog.Description>) {
  return (
    <AlertDialog.Description
      className={cn("mt-2 text-sm leading-6 text-slate-600", className)}
      {...props}
    />
  );
}
