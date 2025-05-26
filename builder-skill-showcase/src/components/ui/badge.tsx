
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "elite-badge",
  {
    variants: {
      variant: {
        default: "elite-badge-primary",
        secondary: "elite-badge-secondary",
        accent: "elite-badge-accent",
        destructive: "elite-badge-danger",
        outline: "border border-elite-blue text-elite-blue bg-white",
        success: "elite-badge-success",
        warning: "elite-badge-warning",
        info: "elite-badge-secondary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
