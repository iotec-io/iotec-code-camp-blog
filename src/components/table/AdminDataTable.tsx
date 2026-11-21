import React, { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Check,
  ChevronDown,
  Loader2,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button.tsx'
import { Card } from '@/components/ui/card.tsx'
import { cn } from '@/lib/utils.ts'
import { AdminTablePagination } from './AdminTablePagination.tsx'
import { AdminTableSearch } from './AdminTableSearch.tsx'
import { AdminMobileFilters } from './AdminMobileFilters.tsx'
import { AdminMobileList } from './AdminMobileList.tsx'

export interface AdminTableColumn<TRow> {
  key: string
  header: ReactNode
  align?: 'left' | 'center' | 'right'
  headerClassName?: string
  cellClassName?: string
  render: (row: TRow, rowIndex: number) => ReactNode
}

export interface AdminTableFilterOption {
  value: string
  label: string
}

export interface AdminTableFilterConfig {
  id: string
  allLabel: string
  mode?: 'single' | 'multiple'
  options: readonly AdminTableFilterOption[]
  selectedValues: readonly string[]
  onChange: (nextValues: string[]) => void
}

export interface AdminTableQueryState {
  searchQuery: string
  page: number
  pageSize: number
}

export const DEFAULT_ADMIN_TABLE_QUERY: AdminTableQueryState = {
  searchQuery: '',
  page: 1,
  pageSize: 5,
}

const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 20, 25] as const

export interface AdminDataTableProps<TRow> {
  caption: string
  columns: readonly AdminTableColumn<TRow>[]
  data: readonly TRow[]
  getRowKey: (row: TRow, index: number) => string
  isLoading?: boolean
  emptyMessage?: string
  /**
   * Search bar configuration: enabled by default with uniform styling.
   * Pass `enableSearch={false}` to hide the search input.
   */
  enableSearch?: boolean
  searchPlaceholder?: string
  searchHelperText?: string
  filters?: readonly AdminTableFilterConfig[]
  onResetFilters?: () => void
  /**
   * Pagination configuration: managed internally with uniform defaults
   * (pageSize = 5, pageSizeOptions = [5, 10, 20, 25]).
   */
  enablePagination?: boolean
  totalItems?: number
  itemNoun?: string
  defaultPageSize?: number
  pageSizeOptions?: readonly number[]
  /**
   * Notifies parent whenever internal search, page, or pageSize changes
   * so server-side Convex queries stay reactive.
   */
  onQueryChange?: (query: AdminTableQueryState) => void
  className?: string
}

interface FilterDropdownProps {
  filter: AdminTableFilterConfig
  onAfterChange: () => void
}

function FilterDropdown({
  filter,
  onAfterChange,
}: FilterDropdownProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mode = filter.mode ?? 'single'

  useEffect(() => {
    if (!isOpen) return
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const selectedCount = filter.selectedValues.length

  const displayLabel = (() => {
    if (selectedCount === 0) return filter.allLabel
    if (selectedCount === 1) {
      const match = filter.options.find(
        (opt) => opt.value === filter.selectedValues[0],
      )
      return match?.label ?? filter.selectedValues[0]
    }
    return `${filter.allLabel.replace(/^All\s+/i, '')} (${selectedCount})`
  })()

  const handleSelectAll = () => {
    filter.onChange([])
    onAfterChange()
    if (mode === 'single') {
      setIsOpen(false)
    }
  }

  const handleToggleOpen = () => setIsOpen((prev) => !prev)

  const handleToggleOption = (optionValue: string) => {
    if (mode === 'single') {
      if (
        filter.selectedValues.length === 1 &&
        filter.selectedValues[0] === optionValue
      ) {
        filter.onChange([])
      } else {
        filter.onChange([optionValue])
      }
      onAfterChange()
      setIsOpen(false)
      return
    }

    const exists = filter.selectedValues.includes(optionValue)
    if (exists) {
      filter.onChange(
        filter.selectedValues.filter((val) => val !== optionValue),
      )
    } else {
      filter.onChange([...filter.selectedValues, optionValue])
    }
    onAfterChange()
  }

  const handleOptionClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    handleToggleOption(event.currentTarget.value)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={handleToggleOpen}
        className={cn(
          'inline-flex h-9 min-w-36 cursor-pointer items-center justify-between gap-3 rounded-lg border bg-white px-3 text-xs font-medium transition-colors outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30',
          selectedCount > 0
            ? 'border-primary/40 text-foreground'
            : 'border-border text-foreground/85 hover:bg-card/50',
        )}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'size-3.5 shrink-0 text-muted-foreground transition-transform',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-multiselectable={mode === 'multiple'}
          aria-label={filter.allLabel}
          className="absolute right-0 z-30 mt-1.5 min-w-44 rounded-xl border border-border bg-white p-1.5 shadow-lg"
        >
          <button
            type="button"
            role="option"
            aria-selected={selectedCount === 0}
            onClick={handleSelectAll}
            className={cn(
              'flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors',
              selectedCount === 0
                ? 'bg-primary/8 font-semibold text-primary'
                : 'text-foreground hover:bg-card',
            )}
          >
            <span>{filter.allLabel}</span>
            {selectedCount === 0 && (
              <Check aria-hidden="true" className="size-3.5 text-primary" />
            )}
          </button>

          <div className="my-1 h-px bg-border/70" />

          {filter.options.map((option) => {
            const isSelected = filter.selectedValues.includes(option.value)
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                value={option.value}
                onClick={handleOptionClick}
                className={cn(
                  'flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors',
                  isSelected
                    ? 'bg-primary/8 font-semibold text-primary'
                    : 'text-foreground hover:bg-card',
                )}
              >
                <span>{option.label}</span>
                {isSelected && (
                  <Check aria-hidden="true" className="size-3.5 text-primary" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function AdminDataTable<TRow>({
  caption,
  columns,
  data,
  getRowKey,
  isLoading = false,
  emptyMessage = 'No matching entries found.',
  enableSearch = true,
  searchPlaceholder = 'Search entries...',
  searchHelperText,
  filters = [],
  onResetFilters,
  enablePagination = true,
  totalItems,
  itemNoun = 'entries',
  defaultPageSize = DEFAULT_ADMIN_TABLE_QUERY.pageSize,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  onQueryChange,
  className,
}: AdminDataTableProps<TRow>): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState(
    DEFAULT_ADMIN_TABLE_QUERY.searchQuery,
  )
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(
    DEFAULT_ADMIN_TABLE_QUERY.searchQuery,
  )
  const [page, setPage] = useState(DEFAULT_ADMIN_TABLE_QUERY.page)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const searchDebounceTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (searchDebounceTimerRef.current !== null) {
        window.clearTimeout(searchDebounceTimerRef.current)
      }
    }
  }, [])

  const resolvedTotalItems = totalItems ?? data.length
  const totalPages = Math.max(1, Math.ceil(resolvedTotalItems / pageSize))
  const currentPage = Math.min(page, totalPages)

  const emitQueryUpdate = (next: AdminTableQueryState) => {
    onQueryChange?.(next)
  }

  const handleSearchChange = (nextSearch: string) => {
    setSearchQuery(nextSearch)
    setPage(1)

    if (searchDebounceTimerRef.current !== null) {
      window.clearTimeout(searchDebounceTimerRef.current)
    }

    if (!nextSearch.trim()) {
      setDebouncedSearchQuery('')
      emitQueryUpdate({
        searchQuery: '',
        page: 1,
        pageSize,
      })
      return
    }

    searchDebounceTimerRef.current = window.setTimeout(() => {
      setDebouncedSearchQuery(nextSearch)
      emitQueryUpdate({
        searchQuery: nextSearch,
        page: 1,
        pageSize,
      })
    }, 250)
  }

  const handlePageChange = (nextPage: number) => {
    const clamped = Math.max(1, Math.min(nextPage, totalPages))
    setPage(clamped)
    emitQueryUpdate({
      searchQuery: debouncedSearchQuery,
      page: clamped,
      pageSize,
    })
  }

  const handlePageSizeChange = (nextSize: number) => {
    setPageSize(nextSize)
    setPage(1)
    emitQueryUpdate({
      searchQuery: debouncedSearchQuery,
      page: 1,
      pageSize: nextSize,
    })
  }

  const handleFilterChanged = () => {
    setPage(1)
    emitQueryUpdate({
      searchQuery: debouncedSearchQuery,
      page: 1,
      pageSize,
    })
  }

  const handleResetAll = () => {
    if (searchDebounceTimerRef.current !== null) {
      window.clearTimeout(searchDebounceTimerRef.current)
    }
    setSearchQuery('')
    setDebouncedSearchQuery('')
    setPage(1)
    onResetFilters?.()
    emitQueryUpdate({
      searchQuery: '',
      page: 1,
      pageSize,
    })
  }

  const hasToolbar =
    enableSearch || filters.length > 0 || Boolean(onResetFilters)

  return (
    <Card
      className={cn(
        'gap-0 overflow-hidden rounded-2xl border-border bg-white p-0 py-0 shadow-xs',
        className,
      )}
    >
      {/* Uniform Search & Filter Toolbar */}
      {hasToolbar && (
        <div className="border-b border-border/80 bg-card/45 px-5 py-4">
          <div className="flex min-w-0 items-start gap-2 lg:items-center">
            {enableSearch && (
              <AdminTableSearch
                value={searchQuery}
                placeholder={searchPlaceholder}
                helperText={searchHelperText}
                onChange={handleSearchChange}
              />
            )}
            {filters.length > 0 && (
              <AdminMobileFilters
                filters={filters}
                onAfterChange={handleFilterChanged}
                onReset={handleResetAll}
              />
            )}
            <div className="hidden flex-wrap items-center gap-2 md:flex">
              {filters.map((filter) => (
                <FilterDropdown
                  key={filter.id}
                  filter={filter}
                  onAfterChange={handleFilterChanged}
                />
              ))}

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={handleResetAll}
                aria-label="Reset search and filters"
                className="size-9 rounded-lg border border-transparent text-muted-foreground hover:border-border hover:bg-white hover:text-foreground"
              >
                <RotateCcw aria-hidden="true" className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Configurable Table */}
      <AdminMobileList
        caption={caption}
        columns={columns}
        data={data}
        getRowKey={getRowKey}
        isLoading={isLoading}
        emptyMessage={emptyMessage}
      />
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-xs">
          <caption className="sr-only">{caption}</caption>
          <thead className="border-b border-border bg-card/35 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    'px-5 py-3.5',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.headerClassName,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60 bg-white">
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-14 text-center text-xs text-muted-foreground"
                >
                  <div className="inline-flex items-center gap-2">
                    <Loader2
                      aria-hidden="true"
                      className="size-4 animate-spin text-primary"
                    />
                    <span>Loading entries&hellip;</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-14 text-center text-xs text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={getRowKey(row, rowIndex)}
                  className="transition-colors hover:bg-card/35"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-5 py-4 align-middle',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center',
                        col.cellClassName,
                      )}
                    >
                      {col.render(row, rowIndex)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Uniform Built-in Pagination Footer */}
      {enablePagination && (
        <AdminTablePagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={resolvedTotalItems}
          itemNoun={itemNoun}
          pageSizeOptions={pageSizeOptions}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </Card>
  )
}
