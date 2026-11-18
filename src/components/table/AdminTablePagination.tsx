import { useId } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils.ts'

export interface AdminTablePaginationProps {
  currentPage: number
  pageSize: number
  totalItems: number
  itemNoun?: string
  pageSizeOptions?: readonly number[]
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  className?: string
}

export function AdminTablePagination({
  currentPage,
  pageSize,
  totalItems,
  itemNoun = 'entries',
  pageSizeOptions = [5, 10, 20, 25],
  onPageChange,
  onPageSizeChange,
  className,
}: AdminTablePaginationProps) {
  const pageSizeSelectId = useId()

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(currentPage, totalPages)

  const startItem = totalItems > 0 ? (safePage - 1) * pageSize + 1 : 0
  const endItem =
    totalItems > 0 ? Math.min(safePage * pageSize, totalItems) : 0

  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  )

  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-t border-border/80 bg-card/25 px-5 py-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <p>
          Showing{' '}
          <strong className="font-semibold text-foreground">{startItem}</strong>{' '}
          to{' '}
          <strong className="font-semibold text-foreground">{endItem}</strong>{' '}
          of{' '}
          <strong className="font-semibold text-foreground">
            {totalItems}
          </strong>{' '}
          {itemNoun}
        </p>

        {pageSizeOptions.length > 0 && onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <label htmlFor={pageSizeSelectId} className="text-[11px]">
              Per page:
            </label>
            <select
              id={pageSizeSelectId}
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-md border border-border bg-white px-2 py-0.5 text-[11px] font-medium text-foreground outline-none focus-visible:border-primary"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <nav
        aria-label="Table pagination"
        className="flex items-center gap-1 self-end sm:self-auto"
      >
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          aria-label="Previous page"
          className="inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
        >
          <ChevronLeft aria-hidden="true" className="size-3.5" />
        </button>

        {pageNumbers.map((pageNum) => {
          const isCurrent = pageNum === safePage
          return (
            <button
              key={pageNum}
              type="button"
              aria-current={isCurrent ? 'page' : undefined}
              onClick={() => onPageChange(pageNum)}
              className={cn(
                'inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-xs transition-colors',
                isCurrent
                  ? 'bg-primary font-semibold text-primary-foreground shadow-2xs'
                  : 'font-medium text-muted-foreground hover:bg-card hover:text-foreground',
              )}
            >
              {pageNum}
            </button>
          )
        })}

        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          aria-label="Next page"
          className="inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
        >
          <ChevronRight aria-hidden="true" className="size-3.5" />
        </button>
      </nav>
    </div>
  )
}
