import { forwardRef, useId, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { FormFieldHeader } from './FormFieldHeader'
import { FormFieldFeedback } from './FormFieldFeedback'

export interface FormTextareaInputProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  required?: boolean
  hint?: string
  error?: string
  rightLabel?: ReactNode
  counter?: {
    current: number
    max: number
  }
  containerClassName?: string
}

export const FormTextareaInput = forwardRef<
  HTMLTextAreaElement,
  FormTextareaInputProps
>(function FormTextareaInput(
  {
    id: providedId,
    label,
    required,
    hint,
    error,
    rightLabel,
    counter,
    containerClassName,
    className,
    ...textareaProps
  },
  ref,
) {
  const generatedId = useId()
  const feedbackId = useId()
  const textareaId = providedId ?? generatedId
  const hasError = Boolean(error)
  const hasFeedback = Boolean(error || hint)

  return (
    <div className={cn('w-full', containerClassName)}>
      <FormFieldHeader
        htmlFor={textareaId}
        label={label}
        required={required}
        rightLabel={rightLabel}
        counter={counter}
      />

      <Textarea
        ref={ref}
        id={textareaId}
        aria-invalid={hasError}
        aria-describedby={hasFeedback ? feedbackId : undefined}
        className={cn('mt-2', className)}
        {...textareaProps}
      />

      <FormFieldFeedback id={feedbackId} error={error} hint={hint} />
    </div>
  )
})
