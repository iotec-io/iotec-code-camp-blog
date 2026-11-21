import React, { useId } from 'react'
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
}: AdminTablePaginationProps): React.JSX.Element {
  const pageSizeSelectId = useId()

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(currentPage, totalPages)

  const startItem = totalItems > 0 ? (safePage - 1) * pageSize + 1 : 0
  const endItem =
    totalItems > 0 ? Math.min(safePage * pageSize, totalItems) : 0

  const firstPage = Math.max(1, Math.min(safePage - 2, totalPages - 4))
  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => firstPage + index,
  )

  const handlePageSizeSelect = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    onPageSizeChange?.(Number(event.currentTarget.value))
  }

  const handlePreviousPage = (): void => {
    onPageChange(safePage - 1)
  }

  const handleNextPage = (): void => {
    onPageChange(safePage + 1)
  }

  const handlePageClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    onPageChange(Number(event.currentTarget.value))
  }

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
              onChange={handlePageSizeSelect}
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
          onClick={handlePreviousPage}
          aria-label="Previous page"
          className="inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
        >
          <ChevronLeft aria-hidden="true" className="size-3.5" />
        </button>

        <span className="px-2 text-xs text-muted-foreground md:hidden">
          Page {safePage} of {totalPages}
        </span>
        {pageNumbers.map((pageNum) => {
          const isCurrent = pageNum === safePage
          return (
            <button
              key={pageNum}
              type="button"
              value={pageNum}
              aria-current={isCurrent ? 'page' : undefined}
              onClick={handlePageClick}
              className={cn(
                'hidden size-7 cursor-pointer items-center justify-center rounded-md text-xs transition-colors md:inline-flex',
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
          onClick={handleNextPage}
          aria-label="Next page"
          className="inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
        >
          <ChevronRight aria-hidden="true" className="size-3.5" />
        </button>
      </nav>
    </div>
  )
}
