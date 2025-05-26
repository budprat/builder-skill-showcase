
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "neo-badge",
        secondary: "neo-badge-secondary",
        accent: "neo-badge-accent",
        destructive: "bg-hot-pink text-white shadow-sm hover:bg-hot-pink/80",
        outline: "border-white/20 text-white/80 bg-white/5 backdrop-blur-sm",
        success: "bg-bright-green/20 text-bright-green border-bright-green/30",
        warning: "bg-electric-orange/20 text-electric-orange border-electric-orange/30",
        info: "bg-electric-blue/20 text-electric-blue border-electric-blue/30",
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
