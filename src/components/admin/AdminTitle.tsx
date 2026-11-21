import React, { type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface AdminTitleButton {
  id?: string
  label: string
  icon?: ReactNode
  variant?:
    | 'default'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'destructive'
    | 'link'
  onClick?: () => void
  disabled?: boolean
  isLoading?: boolean
  className?: string
}

export interface AdminTitleProps {
  title: string
  subtitle?: ReactNode
  buttons?: readonly AdminTitleButton[]
  className?: string
}

export function AdminTitle({
  title,
  subtitle,
  buttons = [],
  className,
}: AdminTitleProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex w-full min-w-0 flex-col items-start gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between',
        className,
      )}
    >
      <div className="w-full min-w-0 md:flex-1">
        <h1 className="w-full font-serif text-3xl font-normal tracking-tight text-foreground wrap-break-word sm:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <div className="mt-2 w-full text-xs text-muted-foreground">{subtitle}</div>
        )}
      </div>

      {buttons.length > 0 && (
        <div className="flex w-full flex-wrap items-center justify-start gap-2.5 md:w-auto md:shrink-0 md:justify-end">
          {buttons.map((btn, index) => {
            const isPrimary = !btn.variant || btn.variant === 'default'
            return (
              <Button
                key={btn.id ?? `${btn.label}-${index}`}
                type="button"
                variant={btn.variant ?? 'default'}
                disabled={btn.disabled || btn.isLoading}
                onClick={btn.onClick}
                className={cn(
                  'h-9 gap-2 px-4 text-xs font-medium shadow-2xs',
                  isPrimary
                    ? 'bg-primary font-semibold text-primary-foreground hover:bg-primary/90'
                    : 'bg-white',
                  btn.className,
                )}
              >
                {btn.isLoading ? (
                  <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                ) : (
                  btn.icon
                )}
                <span>{btn.label}</span>
              </Button>
            )
          })}
        </div>
      )}
    </div>
  )
}
