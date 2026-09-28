import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50", {
  variants: {
    variant: {
      primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
      secondary: "border border-border bg-card text-foreground hover:bg-muted",
      ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
      danger: "text-destructive hover:bg-destructive-soft",
    },
    size: { default: "h-10 px-4", sm: "h-8 px-3 text-xs", icon: "size-9 p-0" },
  },
  defaultVariants: { variant: "primary", size: "default" },
});

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}