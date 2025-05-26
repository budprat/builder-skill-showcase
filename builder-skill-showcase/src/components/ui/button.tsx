
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-bold text-16 uppercase transition-all duration-swiss ease-swiss focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border-2",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-foreground hover:bg-foreground hover:text-background active:border-4",
        destructive: "bg-destructive text-destructive-foreground border-destructive hover:bg-background hover:text-destructive",
        outline: "border-border bg-background text-foreground hover:bg-muted hover:text-foreground",
        secondary: "bg-secondary text-secondary-foreground border-secondary hover:bg-foreground hover:text-background",
        ghost: "border-transparent text-foreground hover:bg-muted hover:text-foreground",
        link: "border-transparent text-foreground underline-offset-4 hover:underline",
        accent: "bg-accent text-accent-foreground border-accent hover:bg-background hover:text-accent"
      },
      size: {
        default: "h-8 px-3 py-2",
        sm: "h-6 px-2 text-12",
        lg: "h-12 px-6 py-3",
        icon: "h-8 w-8",
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
