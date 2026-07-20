import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/15",
        outline: "text-foreground",
        orange: "border-transparent bg-orange-light text-orange hover:bg-orange/15",
        success: "border-transparent bg-success-bg text-success-text hover:bg-success-bg/85",
        blue: "border-transparent bg-info/10 text-info hover:bg-info/15",
        warning: "border-transparent bg-warning/10 text-warning hover:bg-warning/15",
        neutral: "border-border bg-black2 text-[#9A9A9A] hover:bg-black2/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
