import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "neural-badge inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-neural-gradient text-neural-dark border-neural-teal/30",
        secondary:
          "bg-neural-purple/20 border-neural-purple/30 text-secondary-foreground hover:bg-neural-purple/30",
        destructive:
          "bg-destructive/20 border-destructive/30 text-destructive-foreground hover:bg-destructive/30",
        outline: "text-foreground border-neural-teal/20 hover:border-neural-teal/40",
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
