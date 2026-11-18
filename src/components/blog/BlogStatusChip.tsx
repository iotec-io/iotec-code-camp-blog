import { cn } from '@/lib/utils.ts'

export type BlogStatusType = 'published' | 'draft' | 'archived'

export interface BlogStatusChipProps {
  status: BlogStatusType
  label?: string
  className?: string
}

function getStatusStyles(status: BlogStatusType): {
  chipClassName: string
  dotClassName: string
  defaultLabel: string
} {
  switch (status) {
    case 'published':
      return {
        chipClassName:
          'border-emerald-200/70 bg-emerald-50 text-emerald-700',
        dotClassName: 'bg-emerald-600',
        defaultLabel: 'Published',
      }
    case 'archived':
      return {
        chipClassName: 'border-stone-200 bg-stone-100 text-stone-600',
        dotClassName: 'bg-stone-500',
        defaultLabel: 'Archived',
      }
    case 'draft':
    default:
      return {
        chipClassName: 'border-orange-200/70 bg-orange-50 text-[#9a3412]',
        dotClassName: 'bg-[#c2410c]',
        defaultLabel: 'Draft',
      }
  }
}

export function BlogStatusChip({
  status,
  label,
  className,
}: BlogStatusChipProps) {
  const { chipClassName, dotClassName, defaultLabel } = getStatusStyles(status)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
        chipClassName,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn('size-1.5 rounded-full', dotClassName)}
      />
      <span>{label ?? defaultLabel}</span>
    </span>
  )
}
