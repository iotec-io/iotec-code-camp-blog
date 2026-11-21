import React, { useRef } from 'react'
import { Check, ListFilter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AdminTableFilterConfig } from './AdminDataTable'

export interface AdminMobileFiltersProps {
  filters: readonly AdminTableFilterConfig[]
  onAfterChange: () => void
  onReset: () => void
}

export function AdminMobileFilters({
  filters,
  onAfterChange,
  onReset,
}: AdminMobileFiltersProps): React.JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const selectedCount = filters.reduce((count, filter) => count + filter.selectedValues.length, 0)

  const handleOpen = (): void => {
    dialogRef.current?.showModal()
  }

  const handleClose = (): void => {
    dialogRef.current?.close()
  }

  const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>): void => {
    if (event.target === event.currentTarget) handleClose()
  }

  const handleOptionClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    const filter = filters.find((item) => item.id === event.currentTarget.dataset.filterId)
    if (!filter) return
    const value = event.currentTarget.value
    const nextValues = !value
      ? []
      : filter.mode === 'multiple'
        ? filter.selectedValues.includes(value)
          ? filter.selectedValues.filter((selected) => selected !== value)
          : [...filter.selectedValues, value]
        : filter.selectedValues.includes(value) ? [] : [value]

    filter.onChange(nextValues)
    onAfterChange()
  }

  const handleReset = (): void => {
    onReset()
    handleClose()
  }

  return (
    <div className="shrink-0 md:hidden">
      <Button
        type="button"
        variant="outline"
        aria-label={`Open filters${selectedCount ? `, ${selectedCount} active` : ''}`}
        className="relative size-9 p-0"
        onClick={handleOpen}
      >
        <ListFilter
          aria-hidden="true"
          className="size-4"
        />
        {selectedCount > 0 && (
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
            {selectedCount}
          </span>
        )}
      </Button>
      <dialog
        ref={dialogRef}
        aria-label="Filter entries"
        className="m-auto max-h-[min(80dvh,40rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-border bg-white p-5 text-foreground shadow-xl backdrop:bg-black/50 md:hidden"
        onClick={handleBackdropClick}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-xl">Filters</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close filters"
            onClick={handleClose}
          >
            <X
              aria-hidden="true"
              className="size-4"
            />
          </Button>
        </div>
        <div className="mt-4 space-y-5">
          {filters.map((filter) => (
            <fieldset
              key={filter.id}
              className="space-y-2"
            >
              <legend className="text-xs font-semibold text-foreground">
                {filter.allLabel.replace(/^All\s+/i, '')}
              </legend>
              {[{ value: '', label: filter.allLabel }, ...filter.options].map((option) => {
                const isSelected = option.value
                  ? filter.selectedValues.includes(option.value)
                  : filter.selectedValues.length === 0
                return (
                  <button
                    key={option.value}
                    type="button"
                    value={option.value}
                    data-filter-id={filter.id}
                    aria-pressed={isSelected}
                    className="flex min-h-10 w-full items-center justify-between gap-3 rounded-lg border border-border px-3 text-left text-xs hover:bg-card aria-pressed:border-primary aria-pressed:bg-primary/5"
                    onClick={handleOptionClick}
                  >
                    {option.label}
                    {isSelected && (
                      <Check
                        aria-hidden="true"
                        className="size-4 text-primary"
                      />
                    )}
                  </button>
                )
              })}
            </fieldset>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
          >
            Reset all
          </Button>
          <Button
            type="button"
            onClick={handleClose}
          >
            Show results
          </Button>
        </div>
      </dialog>
    </div>
  )
}
