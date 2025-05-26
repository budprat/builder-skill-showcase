
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 font-['Open_Sans'] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#FF6600] text-white hover:bg-[#e55a00] hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-[#FF6600]",
        destructive: "bg-red-500 text-white hover:bg-red-600 hover:-translate-y-0.5 hover:shadow-lg",
        outline: "border border-[#336699] bg-transparent text-[#336699] hover:bg-[#336699] hover:text-white hover:-translate-y-0.5 hover:shadow-lg",
        secondary: "bg-[#336699] text-white hover:bg-[#2d5a87] hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-[#336699]",
        ghost: "text-[#333333] hover:bg-[#F5F5F5] hover:text-[#003366]",
        link: "text-[#336699] underline-offset-4 hover:underline hover:text-[#003366]"
      },
      size: {
        default: "h-10 px-6 py-2.5",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-md px-8 text-base font-semibold",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
