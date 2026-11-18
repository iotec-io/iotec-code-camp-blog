import { AlertCircle } from 'lucide-react'

export interface FormFieldFeedbackProps {
  id?: string
  error?: string
  hint?: string
}

export function FormFieldFeedback({ id, error, hint }: FormFieldFeedbackProps) {
  if (error) {
    return (
      <p
        id={id}
        role="alert"
        className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-destructive"
      >
        <AlertCircle aria-hidden="true" className="size-3.5 shrink-0" />
        <span>{error}</span>
      </p>
    )
  }

  if (hint) {
    return (
      <p id={id} className="mt-1.5 text-[11px] text-muted-foreground">
        {hint}
      </p>
    )
  }

  return null
}
