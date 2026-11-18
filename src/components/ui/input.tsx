import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border-border bg-card/70 placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:bg-red-50/40 aria-invalid:ring-destructive/20 flex h-10 w-full min-w-0 rounded-lg border px-3.5 py-2 text-sm text-foreground shadow-2xs transition-colors outline-none focus-visible:bg-white focus-visible:ring-3 aria-invalid:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }

