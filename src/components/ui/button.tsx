import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva("inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary-hover",
      primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
      secondary: "border border-border bg-card text-foreground hover:bg-muted",
      outline: "border border-border bg-card text-foreground hover:bg-muted",
      ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
      link: "h-auto px-0 text-primary underline-offset-4 hover:underline",
      danger: "text-destructive hover:bg-destructive-soft",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    },
    size: { default: "h-10 px-4", sm: "h-8 px-3 text-xs", lg: "h-11 px-6", icon: "size-9 p-0" },
  },
  defaultVariants: { variant: "primary", size: "default" },
});

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { asChild?: boolean };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
Button.displayName = "Button";