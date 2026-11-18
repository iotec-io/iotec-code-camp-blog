import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'

export interface FormFieldHeaderProps {
  htmlFor?: string
  label: string
  required?: boolean
  rightLabel?: ReactNode
  counter?: {
    current: number
    max: number
  }
}

export function FormFieldHeader({
  htmlFor,
  label,
  required,
  rightLabel,
  counter,
}: FormFieldHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Label htmlFor={htmlFor}>
        <span>{label}</span>
        {required && (
          <span aria-hidden="true" className="text-destructive">
            *
          </span>
        )}
      </Label>

      {counter ? (
        <span
          className={`text-[11px] ${
            counter.current > counter.max
              ? 'font-semibold text-destructive'
              : 'text-muted-foreground'
          }`}
        >
          {counter.current} / {counter.max} characters max
        </span>
      ) : (
        rightLabel && (
          <div className="text-[11px] text-muted-foreground">{rightLabel}</div>
        )
      )}
    </div>
  )
}
