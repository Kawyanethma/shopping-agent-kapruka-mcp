"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Context ──────────────────────────────────────────────────────────────────
interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | undefined>(
  undefined,
);

function useDialogContext() {
  const ctx = React.useContext(DialogContext);
  if (!ctx) throw new Error("Dialog components must be used inside <Dialog>");
  return ctx;
}

// ─── Root ─────────────────────────────────────────────────────────────────────
interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const Dialog = React.forwardRef<HTMLDivElement, DialogProps>(
  (
    { open: controlledOpen, onOpenChange, defaultOpen = false, children },
    ref,
  ) => {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);

    const isOpen =
      controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
    const setOpen = (value: boolean) => {
      if (controlledOpen === undefined) setUncontrolledOpen(value);
      onOpenChange?.(value);
    };

    return (
      <DialogContext.Provider value={{ open: isOpen, onOpenChange: setOpen }}>
        <div ref={ref}>{children}</div>
      </DialogContext.Provider>
    );
  },
);
Dialog.displayName = "Dialog";

// ─── Trigger ──────────────────────────────────────────────────────────────────
const DialogTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ onClick, ...props }, ref) => {
  const { onOpenChange } = useDialogContext();
  return (
    <button
      ref={ref}
      onClick={(e) => {
        onOpenChange(true);
        onClick?.(e);
      }}
      {...props}
    />
  );
});
DialogTrigger.displayName = "DialogTrigger";

// ─── Portal (conditional render) ──────────────────────────────────────────────
const DialogPortal = ({ children }: { children: React.ReactNode }) => {
  const { open } = useDialogContext();
  if (!open) return null;
  return <>{children}</>;
};
DialogPortal.displayName = "DialogPortal";

// ─── Overlay ──────────────────────────────────────────────────────────────────
const DialogOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, onClick, ...props }, ref) => {
  const { onOpenChange } = useDialogContext();
  return (
    <div
      ref={ref}
      className={cn(
        // Uses theme tokens — no hardcoded colours
        "fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm animate-in fade-in-0",
        className,
      )}
      onClick={(e) => {
        onOpenChange(false);
        onClick?.(e);
      }}
      {...props}
    />
  );
});
DialogOverlay.displayName = "DialogOverlay";

// ─── Content ──────────────────────────────────────────────────────────────────
const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { onOpenChange } = useDialogContext();

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onOpenChange]);

  return (
    <DialogPortal>
      <DialogOverlay />
      <div
        ref={ref}
        className={cn(
          // All colours come from CSS variables → respect the user's theme
          "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2",
          "bg-card text-card-foreground border border-border shadow-xl",
          "rounded-xl max-h-[90vh] overflow-y-auto",
          "animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%]",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {children}

        {/* Close button — themed */}
        <button
          onClick={() => onOpenChange(false)}
          className={cn(
            "absolute right-4 top-4 rounded-md p-1",
            "text-muted-foreground hover:text-foreground hover:bg-muted",
            "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </DialogPortal>
  );
});
DialogContent.displayName = "DialogContent";

// ─── Sub-components ───────────────────────────────────────────────────────────
const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col gap-1.5 text-left", className)}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
      className,
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-foreground",
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    // Uses theme muted-foreground — adapts to light and dark automatically
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

const DialogClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ onClick, ...props }, ref) => {
  const { onOpenChange } = useDialogContext();
  return (
    <button
      ref={ref}
      onClick={(e) => {
        onOpenChange(false);
        onClick?.(e);
      }}
      {...props}
    />
  );
});
DialogClose.displayName = "DialogClose";

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
