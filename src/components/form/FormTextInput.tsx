import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { FormFieldHeader } from './FormFieldHeader'
import { FormFieldFeedback } from './FormFieldFeedback'

export interface FormTextInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label: string
  required?: boolean
  hint?: string
  error?: string
  rightLabel?: ReactNode
  counter?: {
    current: number
    max: number
  }
  startAddon?: ReactNode
  leadingIcon?: ReactNode
  trailingSlot?: ReactNode
  containerClassName?: string
  inputWrapperClassName?: string
}

export const FormTextInput = forwardRef<HTMLInputElement, FormTextInputProps>(
  function FormTextInput(
    {
      id: providedId,
      label,
      required,
      hint,
      error,
      rightLabel,
      counter,
      startAddon,
      leadingIcon,
      trailingSlot,
      containerClassName,
      inputWrapperClassName,
      className,
      ...inputProps
    },
    ref,
  ) {
    const generatedId = useId()
    const feedbackId = useId()
    const inputId = providedId ?? generatedId
    const hasError = Boolean(error)
    const hasFeedback = Boolean(error || hint)
    const hasDecorators = Boolean(startAddon || leadingIcon || trailingSlot)

    return (
      <div className={cn('w-full', containerClassName)}>
        <FormFieldHeader
          htmlFor={inputId}
          label={label}
          required={required}
          rightLabel={rightLabel}
          counter={counter}
        />

        {hasDecorators ? (
          <div
            aria-invalid={hasError}
            className={cn(
              'mt-2 flex h-10 items-center overflow-hidden rounded-lg border border-border bg-card/70 shadow-2xs transition-colors focus-within:border-ring focus-within:bg-white focus-within:ring-3 focus-within:ring-ring/30',
              hasError &&
                'border-destructive bg-red-50/40 ring-3 ring-destructive/20 focus-within:border-destructive focus-within:ring-destructive/20',
              inputWrapperClassName,
            )}
          >
            {startAddon && (
              <div className="flex h-full shrink-0 items-center gap-1.5 border-r border-border px-3 text-xs font-semibold text-foreground">
                {startAddon}
              </div>
            )}

            <div className="flex flex-1 items-center gap-2 px-3">
              {leadingIcon && (
                <span className="shrink-0 text-muted-foreground">
                  {leadingIcon}
                </span>
              )}
              <input
                ref={ref}
                id={inputId}
                aria-invalid={hasError}
                aria-describedby={hasFeedback ? feedbackId : undefined}
                className={cn(
                  'w-full min-w-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 outline-none disabled:cursor-not-allowed disabled:opacity-50',
                  className,
                )}
                {...inputProps}
              />
              {trailingSlot && <div className="shrink-0">{trailingSlot}</div>}
            </div>
          </div>
        ) : (
          <Input
            ref={ref}
            id={inputId}
            aria-invalid={hasError}
            aria-describedby={hasFeedback ? feedbackId : undefined}
            className={cn('mt-2', className)}
            {...inputProps}
          />
        )}

        <FormFieldFeedback id={feedbackId} error={error} hint={hint} />
      </div>
    )
  },
)
