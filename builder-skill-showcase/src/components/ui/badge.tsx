
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 font-['Open_Sans'] uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#003366] text-white hover:bg-[#002244]",
        secondary: "border-transparent bg-[#336699] text-white hover:bg-[#2d5a87]",
        accent: "border-transparent bg-[#FF6600] text-white hover:bg-[#e55a00]",
        destructive: "border-transparent bg-red-500 text-white hover:bg-red-600",
        outline: "border-[#336699] text-[#336699] hover:bg-[#336699] hover:text-white",
        success: "border-transparent bg-green-500 text-white hover:bg-green-600",
        warning: "border-transparent bg-yellow-500 text-white hover:bg-yellow-600"
      }
    },
    defaultVariants: {
      variant: "default"
    }
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
