import React, { useId } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils.ts'

export interface AdminTableSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  helperText?: string
  className?: string
}

export function AdminTableSearch({
  value,
  onChange,
  placeholder = 'Search entries by title or keyword...',
  helperText,
  className,
}: AdminTableSearchProps): React.JSX.Element {
  const searchInputId = useId()
  const searchHelperId = useId()

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    onChange(event.currentTarget.value)
  }

  return (
    <div className={cn('min-w-0 flex-1', className)}>
      <label htmlFor={searchInputId} className="sr-only">
        {placeholder}
      </label>

      <div className="flex h-9 w-full items-center gap-2.5 rounded-lg border border-border bg-white px-3 shadow-2xs transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
        <Search
          aria-hidden="true"
          className="size-3.5 shrink-0 text-muted-foreground"
        />
        <input
          id={searchInputId}
          type="search"
          value={value}
          placeholder={placeholder}
          aria-describedby={helperText ? searchHelperId : undefined}
          className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground/75 outline-none"
          onChange={handleInputChange}
        />
      </div>

      {helperText && (
        <p
          id={searchHelperId}
          className="mt-1.5 text-[11px] text-muted-foreground"
        >
          {helperText}
        </p>
      )}
    </div>
  )
}
