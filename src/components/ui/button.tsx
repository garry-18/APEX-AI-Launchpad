import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white shadow-sm hover:bg-[#F15A24] hover:-translate-y-0.5 hover:shadow active:translate-y-0 transition-all",
        destructive:
          "bg-[#EF4444] text-white shadow-sm hover:bg-[#EF4444]/90 hover:-translate-y-0.5 hover:shadow active:translate-y-0 transition-all",
        outline:
          "border border-border bg-transparent text-foreground shadow-sm hover:bg-surface-2 hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 transition-all",
        secondary:
          "bg-[#FAFAFA] border border-[#EAEAEA] text-[#6B7280] shadow-sm hover:bg-[#F3F4F6] hover:text-[#111827] hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 transition-all",
        ghost: "bg-transparent text-[#6B7280] hover:text-[#111827] hover:bg-surface-2 transition-all",
        link: "text-primary underline-offset-4 hover:underline",
        success:
          "bg-[#22C55E] text-white shadow-sm hover:bg-[#22C55E]/90 hover:-translate-y-0.5 hover:shadow active:translate-y-0 transition-all",
      },
      size: {
        default: "h-10 px-5 py-2.5",
        sm: "h-8 rounded px-3 text-xs",
        lg: "h-11 rounded-lg px-8 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
