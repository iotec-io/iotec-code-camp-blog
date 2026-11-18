import type { ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button.tsx'
import { cn } from '@/lib/utils.ts'

export interface TableActionButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: LucideIcon
  label: string
  tone?: 'default' | 'destructive'
  iconClassName?: string
}

export function TableActionButton({
  icon: Icon,
  label,
  tone = 'default',
  className,
  iconClassName,
  ...props
}: TableActionButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label={label}
      className={cn(
        'size-7 cursor-pointer rounded p-1 text-muted-foreground transition-colors',
        tone === 'destructive'
          ? 'hover:bg-red-50 hover:text-destructive'
          : 'hover:bg-card hover:text-foreground',
        className,
      )}
      {...props}
    >
      <Icon aria-hidden="true" className={cn('size-4', iconClassName)} />
    </Button>
  )
}
