
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "elite-btn-primary",
        destructive: "bg-red-500 text-white hover:bg-red-600 rounded-md px-6 py-3",
        outline: "border border-elite-blue text-elite-blue bg-white hover:bg-elite-light rounded-md px-6 py-3",
        secondary: "elite-btn-secondary",
        ghost: "text-elite-blue hover:bg-elite-light rounded-md px-4 py-2",
        link: "text-elite-orange underline-offset-4 hover:underline px-0 py-0",
      },
      size: {
        default: "px-6 py-3 text-base",
        sm: "px-4 py-2 text-sm rounded-sm",
        lg: "px-8 py-4 text-lg rounded-md",
        icon: "h-10 w-10 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
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
