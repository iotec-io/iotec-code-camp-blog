import React from 'react'
import { Loader2 } from 'lucide-react'
import type { AdminTableColumn } from './AdminDataTable'

export interface AdminMobileListProps<TRow> {
  caption: string
  columns: readonly AdminTableColumn<TRow>[]
  data: readonly TRow[]
  getRowKey: (row: TRow, index: number) => string
  isLoading: boolean
  emptyMessage: string
}

export function AdminMobileList<TRow>({
  caption,
  columns,
  data,
  getRowKey,
  isLoading,
  emptyMessage,
}: AdminMobileListProps<TRow>): React.JSX.Element {
  return (
    <section
      aria-label={caption}
      className="md:hidden"
    >
      {isLoading ? (
        <p className="flex items-center justify-center gap-2 px-4 py-14 text-xs text-muted-foreground">
          <Loader2
            aria-hidden="true"
            className="size-4 animate-spin text-primary"
          />
          Loading entries&hellip;
        </p>
      ) : data.length === 0 ? (
        <p className="px-4 py-14 text-center text-xs text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        <ul className="divide-y divide-border/70">
          {data.map((row, rowIndex) => (
            <li
              key={getRowKey(row, rowIndex)}
              className="space-y-3 px-4 py-5"
            >
              {columns.map((column) => (
                <div
                  key={column.key}
                  className={column.key === 'actions'
                    ? 'flex flex-wrap items-center justify-start gap-2 border-t border-border/60 pt-3 [&_button]:min-h-9 [&_button]:min-w-9'
                    : 'grid min-w-0 grid-cols-[minmax(0,6rem)_minmax(0,1fr)] items-start gap-3 text-xs'}
                >
                  {column.key !== 'actions' && (
                    <span className="text-muted-foreground">{column.header}</span>
                  )}
                  <div className="min-w-0 wrap-break-word">
                    {column.render(row, rowIndex)}
                  </div>
                </div>
              ))}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
