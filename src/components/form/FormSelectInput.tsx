import { useId } from 'react'
import { ChevronDown } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { FormFieldHeader } from './FormFieldHeader'
import { FormFieldFeedback } from './FormFieldFeedback'

export interface SelectOption<T extends string = string> {
  value: T
  label: string
}

export interface FormSelectInputProps<T extends string = string> {
  id?: string
  label: string
  options: readonly SelectOption<T>[]
  value: T
  onChange: (value: T) => void
  required?: boolean
  inline?: boolean
  hint?: string
  error?: string
  containerClassName?: string
  selectClassName?: string
}

export function FormSelectInput<T extends string = string>({
  id: providedId,
  label,
  options,
  value,
  onChange,
  required,
  inline = false,
  hint,
  error,
  containerClassName,
  selectClassName,
}: FormSelectInputProps<T>) {
  const generatedId = useId()
  const feedbackId = useId()
  const selectId = providedId ?? generatedId
  const hasError = Boolean(error)
  const hasFeedback = Boolean(error || hint)

  if (inline) {
    return (
      <div className={cn('inline-flex items-center gap-2.5', containerClassName)}>
        <Label
          htmlFor={selectId}
          className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase"
        >
          <span>{label}</span>
          {required && (
            <span aria-hidden="true" className="text-destructive">
              *
            </span>
          )}
        </Label>

        <div className="relative">
          <select
            id={selectId}
            value={value}
            onChange={(e) => onChange(e.target.value as T)}
            aria-invalid={hasError}
            className={cn(
              'appearance-none rounded-md border border-border bg-card py-1 pr-7 pl-2.5 text-xs font-medium text-foreground shadow-2xs transition-colors outline-none focus-visible:border-ring focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-ring/30',
              hasError &&
                'border-destructive bg-red-50/40 ring-2 ring-destructive/20',
              selectClassName,
            )}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-2 size-3 -translate-y-1/2 text-muted-foreground"
          />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('w-full', containerClassName)}>
      <FormFieldHeader htmlFor={selectId} label={label} required={required} />

      <div className="relative mt-2">
        <select
          id={selectId}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          aria-invalid={hasError}
          aria-describedby={hasFeedback ? feedbackId : undefined}
          className={cn(
            'flex h-10 w-full appearance-none rounded-lg border border-border bg-card/70 py-2 pr-9 pl-3.5 text-sm font-medium text-foreground shadow-2xs transition-colors outline-none focus-visible:border-ring focus-visible:bg-white focus-visible:ring-3 focus-visible:ring-ring/30',
            hasError &&
              'border-destructive bg-red-50/40 ring-3 ring-destructive/20',
            selectClassName,
          )}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
      </div>

      <FormFieldFeedback id={feedbackId} error={error} hint={hint} />
    </div>
  )
}
