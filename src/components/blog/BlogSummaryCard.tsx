import { Card } from '@/components/ui/card.tsx'
import { cn } from '@/lib/utils.ts'
import { BlogStatusChip, type BlogStatusType } from './BlogStatusChip.tsx'

export interface BlogSummaryCardProps {
  status: BlogStatusType
  count: number
  title?: string
  chipLabel?: string
  description?: string
  className?: string
}

function getSummaryCardConfig(status: BlogStatusType): {
  defaultTitle: string
  defaultChipLabel: string
  defaultDescription: string
  cardClassName: string
  countClassName: string
} {
  switch (status) {
    case 'published':
      return {
        defaultTitle: 'Published',
        defaultChipLabel: 'Live & Dispatched',
        defaultDescription: 'blogs in circulation',
        cardClassName: 'bg-linear-to-br from-white via-white to-emerald-50/45',
        countClassName: 'text-foreground',
      }
    case 'archived':
      return {
        defaultTitle: 'Archived',
        defaultChipLabel: 'Deprecating / Retired',
        defaultDescription: 'retracted to permanent cold vault',
        cardClassName: 'bg-linear-to-br from-white via-white to-stone-100/60',
        countClassName: 'text-foreground',
      }
    case 'draft':
    default:
      return {
        defaultTitle: 'Drafts',
        defaultChipLabel: 'In Editorial Review',
        defaultDescription: 'awaiting lead peer sign-off',
        cardClassName:
          'border-t-2 border-t-amber-400 bg-linear-to-br from-white via-white to-orange-50/45',
        countClassName: 'text-[#9a3412]',
      }
  }
}

export function BlogSummaryCard({
  status,
  count,
  title,
  chipLabel,
  description,
  className,
}: BlogSummaryCardProps) {
  const {
    defaultTitle,
    defaultChipLabel,
    defaultDescription,
    cardClassName,
    countClassName,
  } = getSummaryCardConfig(status)

  return (
    <Card
      className={cn(
        'gap-4 rounded-2xl border-border p-5 shadow-2xs',
        cardClassName,
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          {title ?? defaultTitle}
        </span>
        <BlogStatusChip
          status={status}
          label={chipLabel ?? defaultChipLabel}
          className="text-[10px]"
        />
      </div>

      <div className="flex items-baseline gap-2.5">
        <span
          className={cn(
            'font-serif text-4xl leading-none font-normal',
            countClassName,
          )}
        >
          {count}
        </span>
        <span className="text-xs text-muted-foreground">
          {description ?? defaultDescription}
        </span>
      </div>
    </Card>
  )
}
