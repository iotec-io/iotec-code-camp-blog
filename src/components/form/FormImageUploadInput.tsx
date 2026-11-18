import { useId, useRef, type ChangeEvent, type DragEvent } from 'react'
import { ExternalLink, ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FormFieldHeader } from './FormFieldHeader'
import { FormFieldFeedback } from './FormFieldFeedback'

export interface FormImageUploadInputProps {
  label: string
  required?: boolean
  rightLabel?: string
  accept?: string
  helperText?: string
  badges?: readonly string[]
  isUploading?: boolean
  previewUrl?: string | null
  fileName?: string
  fileSizeBytes?: number
  dimensions?: string
  error?: string
  onSelectFile: (file: File) => void
  onRemoveFile: () => void
  containerClassName?: string
}

function formatBytesToMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FormImageUploadInput({
  label,
  required,
  rightLabel = 'Aspect ratio 16:9 recommended',
  accept = 'image/webp,image/jpeg,image/png',
  helperText = 'Supported formats: WebP, JPG, PNG only (Max file size: 5MB)',
  badges = ['High Res', 'RGB Color Profile', '2400 × 1350 px'],
  isUploading = false,
  previewUrl,
  fileName,
  fileSizeBytes,
  dimensions = '2400 × 1350',
  error,
  onSelectFile,
  onRemoveFile,
  containerClassName,
}: FormImageUploadInputProps) {
  const fileInputId = useId()
  const feedbackId = useId()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const hasError = Boolean(error)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onSelectFile(file)
    }
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file) {
      onSelectFile(file)
    }
  }

  const handleRemove = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onRemoveFile()
  }

  return (
    <div className={cn('w-full', containerClassName)}>
      <FormFieldHeader
        htmlFor={fileInputId}
        label={label}
        required={required}
        rightLabel={rightLabel}
      />

      <input
        ref={fileInputRef}
        id={fileInputId}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="sr-only"
      />

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            fileInputRef.current?.click()
          }
        }}
        aria-invalid={hasError}
        aria-describedby={hasError ? feedbackId : undefined}
        className={cn(
          'mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors',
          hasError
            ? 'border-destructive bg-red-50/40 ring-3 ring-destructive/20'
            : 'border-border bg-card/60 hover:border-primary/40 hover:bg-card',
        )}
      >
        <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground shadow-2xs">
          {isUploading ? (
            <Loader2
              aria-hidden="true"
              className="size-4 animate-spin text-primary"
            />
          ) : (
            <ImagePlus aria-hidden="true" className="size-4" />
          )}
        </div>

        <p className="mt-3 text-xs text-foreground">
          <span className="font-semibold text-[#9a5b42] underline underline-offset-2">
            Click to upload
          </span>{' '}
          or drag and drop image
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">{helperText}</p>

        {badges.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
            {badges.map((badge) => (
              <span
                key={badge}
                className="rounded border border-border bg-white px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                {badge}
              </span>
            ))}
          </div>
        )}
      </div>

      <FormFieldFeedback id={feedbackId} error={error} />

      {previewUrl && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-border bg-card/70 p-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={previewUrl}
              alt="Uploaded cover preview"
              className="h-11 w-16 shrink-0 rounded-md border border-border object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-foreground">
                {fileName || 'kampala_telecom_infrastructure_archival.webp'}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {formatBytesToMb(fileSizeBytes || 2400000)} &middot; {dimensions}{' '}
                &middot; Processed
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Replace cover image"
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink aria-hidden="true" className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={handleRemove}
              aria-label="Remove cover image"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 aria-hidden="true" className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
