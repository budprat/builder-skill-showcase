
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "cyber-badge",
  {
    variants: {
      variant: {
        default: "cyber-badge",
        secondary: "cyber-badge-secondary",
        destructive:
          "bg-red-500/20 text-red-400 border-red-500/50 neon-glow-pink",
        outline: "border border-cyber-electric-blue/50 bg-cyber-dark-gray/50 text-cyber-electric-blue backdrop-blur-md",
        success: "bg-green-500/20 text-cyber-lime-green border-cyber-lime-green/50 neon-glow-green",
        warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
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
