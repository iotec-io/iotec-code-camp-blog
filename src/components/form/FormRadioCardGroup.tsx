import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { FormFieldHeader } from './FormFieldHeader'

export interface RadioCardOption<T extends string = string> {
  value: T
  label: string
  icon?: ReactNode
  activeClassName?: string
}

export interface FormRadioCardGroupProps<T extends string = string> {
  label: string
  options: readonly RadioCardOption<T>[]
  value: T
  onChange: (value: T) => void
  rightLabel?: ReactNode
  layout?: 'horizontal' | 'stacked'
  containerClassName?: string
}

export function FormRadioCardGroup<T extends string = string>({
  label,
  options,
  value,
  onChange,
  rightLabel,
  layout = 'horizontal',
  containerClassName,
}: FormRadioCardGroupProps<T>) {
  return (
    <div className={cn('w-full', containerClassName)}>
      <FormFieldHeader label={label} rightLabel={rightLabel} />

      <div
        role="radiogroup"
        aria-label={label}
        className="mt-2 grid grid-cols-2 gap-2"
      >
        {options.map((opt) => {
          const isSelected = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(opt.value)}
              className={cn(
                'flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border py-2.5 text-xs transition-all',
                layout === 'stacked' && 'flex-col py-3',
                isSelected
                  ? opt.activeClassName ??
                      'border-primary bg-primary/8 font-semibold text-primary shadow-2xs'
                  : 'border-border bg-card/60 font-medium text-muted-foreground hover:bg-card',
              )}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
