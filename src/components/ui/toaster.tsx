import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type ToastVariant = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  title: string
  description?: string
  variant: ToastVariant
}

type ToastListener = (toasts: readonly ToastItem[]) => void

let toastsState: readonly ToastItem[] = []
const listeners = new Set<ToastListener>()

function notifyListeners() {
  for (const listener of listeners) {
    listener(toastsState)
  }
}

export function dismissToast(id: string) {
  toastsState = toastsState.filter((item) => item.id !== id)
  notifyListeners()
}

function addToast(variant: ToastVariant, title: string, description?: string, durationMs = 4500) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const nextToast: ToastItem = { id, title, description, variant }
  toastsState = [...toastsState, nextToast]
  notifyListeners()

  if (durationMs > 0 && typeof window !== 'undefined') {
    window.setTimeout(() => {
      dismissToast(id)
    }, durationMs)
  }

  return id
}

export const toast = {
  success: (title: string, description?: string) =>
    addToast('success', title, description),
  error: (title: string, description?: string) =>
    addToast('error', title, description, 5500),
  info: (title: string, description?: string) =>
    addToast('info', title, description),
}

export function Toaster() {
  const [items, setItems] = useState<readonly ToastItem[]>(toastsState)

  useEffect(() => {
    listeners.add(setItems)
    return () => {
      listeners.delete(setItems)
    }
  }, [])

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-full max-w-sm flex-col gap-2.5 sm:right-6 sm:bottom-6"
    >
      {items.map((item) => {
        const isError = item.variant === 'error'
        const isSuccess = item.variant === 'success'

        return (
          <div
            key={item.id}
            role={isError ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg transition-all ${
              isError
                ? 'border-red-200 bg-red-50 text-red-950'
                : isSuccess
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                  : 'border-border bg-white text-foreground'
            }`}
          >
            {isError ? (
              <AlertCircle
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-red-600"
              />
            ) : isSuccess ? (
              <CheckCircle2
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-emerald-600"
              />
            ) : (
              <Info
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-primary"
              />
            )}

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold leading-snug">{item.title}</p>
              {item.description && (
                <p
                  className={`mt-1 text-[11px] leading-relaxed ${
                    isError
                      ? 'text-red-800/90'
                      : isSuccess
                        ? 'text-emerald-800/90'
                        : 'text-muted-foreground'
                  }`}
                >
                  {item.description}
                </p>
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => dismissToast(item.id)}
              aria-label="Dismiss notification"
              className="shrink-0 opacity-70 hover:opacity-100"
            >
              <X aria-hidden="true" className="size-3.5" />
            </Button>
          </div>
        )
      })}
    </div>
  )
}

