import React, { useEffect, useState, type FormEvent } from 'react'
import { useAction } from 'convex/react'
import { ConvexError } from 'convex/values'
import type { Id } from '../../../convex/_generated/dataModel'
import { api } from '../../../convex/_generated/api'
import {
  AlertCircle,
  AtSign,
  CheckCircle2,
  Loader2,
  Lock,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react'
import { FormTextInput } from '@/components/form'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from '@/components/ui/toaster'

type AccessTab = 'new-access' | 'restore-access'
type PaywallSessionStatus = 'idle' | 'processing' | 'success' | 'error'

interface BlogPaywallDialogProps {
  blogId: Id<'blogs'>
  priceAmount: string
  paymentCurrency: 'ITX' | 'UGX' | null
  onUnlock: (accessKey: string) => void
}

export function BlogPaywallDialog({
  blogId,
  priceAmount,
  paymentCurrency,
  onUnlock,
}: BlogPaywallDialogProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<AccessTab>('new-access')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [emailError, setEmailError] = useState<string | undefined>(undefined)
  const [phoneError, setPhoneError] = useState<string | undefined>(undefined)

  const [sessionStatus, setSessionStatus] = useState<PaywallSessionStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [attempt, setAttempt] = useState<{
    transactionId: Id<'transactions'>
  } | null>(null)
  const initiateCollection = useAction(api.iotecPay.iotecPayActions.initiateCollection)
  const checkCollectionStatus = useAction(api.iotecPay.iotecPayActions.checkCollectionStatus)
  const restoreAccess = useAction(api.iotecPay.iotecPayActions.restoreAccess)

  const completeWithSuccess = (accessKey: string): void => {
    setErrorMessage(null)
    setEmailError(undefined)
    setPhoneError(undefined)
    setSessionStatus('success')

    toast.success(
      paymentCurrency === 'ITX' ? 'ITX Test Payment Confirmed' : 'Mobile Money Payment Confirmed',
      `Your ${priceAmount} ${paymentCurrency === 'ITX' ? 'test payment' : 'Mobile Money payment'} was confirmed. Full essay unlocked.`,
    )
    onUnlock(accessKey)
  }

  const completeWithFailure = (reason: string): void => {
    setErrorMessage(reason)
    setSessionStatus('error')

    toast.error('Payment Not Completed', reason)
  }

  useEffect(() => {
    if (!attempt) return
    let cancelled = false
    let timer: number
    const startedAt = Date.now()
    const poll = async (): Promise<void> => {
      try {
        const result = await checkCollectionStatus(attempt)
        if (cancelled) return
        if (result.status === 'completed') {
          completeWithSuccess(attempt.transactionId)
          return
        }
        if (result.status === 'failed') {
          setAttempt(null)
          completeWithFailure(result.message ?? 'The Mobile Money request was declined. Please try again.')
          return
        }
      } catch {
        // Provider status can be temporarily unavailable while the request settles.
      }
      if (cancelled) return
      if (Date.now() - startedAt >= 120_000) {
        setAttempt(null)
        completeWithFailure('Payment is still unconfirmed. If you approved it, return with your email to check again.')
        return
      }
      timer = window.setTimeout(poll, 4000)
    }
    timer = window.setTimeout(poll, 3000)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [attempt, checkCollectionStatus, onUnlock, priceAmount])

  const handleTabSwitch = (nextTab: AccessTab): void => {
    setActiveTab(nextTab)
    setEmailError(undefined)
    setPhoneError(undefined)
    setErrorMessage(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (sessionStatus === 'processing' || sessionStatus === 'success') return
    if (!paymentCurrency && activeTab === 'new-access') {
      completeWithFailure('Payments are not configured yet. Please try again later.')
      return
    }

    const trimmedEmail = email.trim()
    const trimmedPhone = phone.replace(/\D/g, '')

    let hasFieldError = false
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address.')
      hasFieldError = true
    } else {
      setEmailError(undefined)
    }

    const validPhone = paymentCurrency === 'ITX'
      ? /^011177777[0-9]$/.test(trimmedPhone)
      : /^07[0-9]{8}$/.test(trimmedPhone)
    if (activeTab === 'new-access' && !validPhone) {
      setPhoneError(paymentCurrency === 'ITX'
        ? 'Use an iotecPay test number from 0111777770 to 0111777779.'
        : 'Enter a 10-digit Mobile Money number starting with 07.')
      hasFieldError = true
    } else {
      setPhoneError(undefined)
    }

    if (hasFieldError) {
      return
    }

    setErrorMessage(null)
    setSessionStatus('processing')

    try {
      if (activeTab === 'restore-access') {
        const key = await restoreAccess({ blogId, email: trimmedEmail })
        if (key) {
          completeWithSuccess(key)
        } else {
          completeWithFailure('No completed payment was found for this email and blog.')
        }
        return
      }
      const result = await initiateCollection({
        blogId,
        email: trimmedEmail,
        phoneNumber: trimmedPhone,
      })
      if (result.status === 'completed') {
        completeWithSuccess(result.transactionId)
      } else if (result.status === 'failed') {
        completeWithFailure('This payment was declined. Please try again.')
      } else {
        setAttempt({ transactionId: result.transactionId })
      }
    } catch (error) {
      const message = error instanceof ConvexError && typeof error.data === 'string'
        ? error.data
        : 'Payment could not be started. Please try again.'
      completeWithFailure(message)
    }
  }

  const handleNewAccessTab = (): void => handleTabSwitch('new-access')
  const handleRestoreAccessTab = (): void => handleTabSwitch('restore-access')
  const handleDismissError = (): void => setErrorMessage(null)
  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setEmail(event.target.value)
    if (emailError) setEmailError(undefined)
  }
  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setPhone(event.target.value)
    if (phoneError) setPhoneError(undefined)
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="paywall-dialog-title"
      className="relative z-10 mx-auto -mt-4 w-full max-w-xl"
    >
      <Card className="gap-0 rounded-2xl border-border bg-white p-6 shadow-xl sm:p-8">
        {/* Error Banner at the Top of the Paywall Dialog */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-900"
          >
            <AlertCircle
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-red-600"
            />
            <div className="min-w-0 flex-1 text-xs leading-relaxed">
              <p className="font-semibold text-red-950">
                Transaction Could Not Be Completed
              </p>
              <p className="mt-0.5 text-[11px] text-red-800">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={handleDismissError}
              aria-label="Dismiss error message"
              className="cursor-pointer rounded p-0.5 text-red-600 transition-colors hover:bg-red-100 hover:text-red-900"
            >
              <X aria-hidden="true" className="size-3.5" />
            </button>
          </div>
        )}

        {/* Top Lock Icon Badge */}
        <div
          className={`mx-auto flex size-11 items-center justify-center rounded-xl border transition-colors ${
            sessionStatus === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
              : sessionStatus === 'processing'
                ? 'border-primary/25 bg-primary/10 text-primary'
                : 'border-amber-200/80 bg-amber-50/90 text-amber-600'
          }`}
        >
          {sessionStatus === 'success' ? (
            <CheckCircle2 aria-hidden="true" className="size-5" />
          ) : sessionStatus === 'processing' ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Lock aria-hidden="true" className="size-4" />
          )}
        </div>

        {/* Heading & Description */}
        <h2
          id="paywall-dialog-title"
          className="mt-4 text-center font-serif text-xl leading-snug font-medium tracking-tight text-foreground sm:text-2xl"
        >
          Support Independent Writing &amp; Unlock Full Blog
        </h2>

        {/* Contribution Price Pill */}
        <div className="mx-auto mt-4 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-amber-200/80 bg-amber-50/60 px-4 py-1.5">
          <span className="text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            One-Time Reader Contribution
          </span>
          <span className="font-serif text-sm font-bold text-amber-700">
            {priceAmount}
          </span>
        </div>
        {!paymentCurrency && (
          <p
            role="alert"
            className="mt-4 text-center text-xs text-red-700"
          >
            New payments are unavailable until a currency is configured. Previous
            purchases can still be restored by email.
          </p>
        )}

        {/* STATE 1: Processing & Waiting for USSD Session */}
        {sessionStatus === 'processing' && (
          <div
            role="status"
            aria-live="polite"
            className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-5 text-center"
          >
            <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-white text-primary shadow-2xs">
              <Smartphone aria-hidden="true" className="size-5 animate-pulse" />
            </div>

            <p className="mt-3 text-sm font-semibold text-foreground">
              {activeTab === 'restore-access'
                ? 'Checking Your Previous Payment...'
                : paymentCurrency === 'ITX'
                  ? 'Waiting for ITX Test Payment...'
                  : 'Waiting for Mobile Money Confirmation...'}
            </p>
            <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
              {activeTab === 'restore-access'
                ? 'Checking the payment linked to your email address.'
                : `Approve the ${priceAmount} Mobile Money request on your phone to unlock this blog.`}
            </p>

            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-medium text-primary">
              <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
              <span>Checking payment status&hellip;</span>
            </div>

            {activeTab === 'new-access' && (
              <p className="mt-4 text-xs text-muted-foreground">
                {paymentCurrency === 'ITX'
                  ? 'Using an iotecPay staging test number.'
                  : 'Keep this page open while you approve the prompt on your phone.'}
              </p>
            )}
          </div>
        )}

        {/* STATE 2: Brief Success Confirmation State Before Removing Paywall */}
        {sessionStatus === 'success' && (
          <div
            role="status"
            aria-live="polite"
            className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/90 p-6 text-center"
          >
            <CheckCircle2
              aria-hidden="true"
              className="mx-auto size-8 text-emerald-600"
            />
            <p className="mt-3 font-serif text-lg font-medium text-emerald-950">
              Authorization Approved &mdash; Unlocking Essay
            </p>
            <p className="mt-1 text-xs text-emerald-800">
              Your reading pass for this blog is linked to{' '}
              <strong>{email.trim()}</strong>. Revealing full dispatch&hellip;
            </p>
          </div>
        )}

        {/* STATE 3: Form (Idle or Error State) */}
        {(sessionStatus === 'idle' || sessionStatus === 'error') && (
          <>
            {/* Mode Switcher Tabs */}
            <div
              role="tablist"
              aria-label="Article access method"
              className="mt-6 grid grid-cols-2 gap-1 rounded-lg border border-border bg-card p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'new-access'}
                onClick={handleNewAccessTab}
                className={`cursor-pointer rounded-md py-2 text-xs transition-all ${
                  activeTab === 'new-access'
                    ? 'bg-white font-semibold text-primary shadow-2xs'
                    : 'font-medium text-muted-foreground hover:text-foreground'
                }`}
              >
                New Access (Mobile Money)
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'restore-access'}
                onClick={handleRestoreAccessTab}
                className={`cursor-pointer rounded-md py-2 text-xs transition-all ${
                  activeTab === 'restore-access'
                    ? 'bg-white font-semibold text-primary shadow-2xs'
                    : 'font-medium text-muted-foreground hover:text-foreground'
                }`}
              >
                Returning Reader (Restore)
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5" noValidate>
              {/* Form 1: New Access (Mobile Money) vs Form 2: Returning Reader (Restore) */}
              {activeTab === 'new-access' ? (
                <>
                  <FormTextInput
                    label="Your Email Address"
                    required
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    placeholder="reader@domain.com"
                    leadingIcon={
                      <AtSign aria-hidden="true" className="size-3.5" />
                    }
                    hint="Used to associate and restore access to this blog."
                    error={emailError}
                    containerClassName="mt-4"
                    inputWrapperClassName="h-9"
                    className="text-xs"
                    onChange={handleEmailChange}
                  />

                  <FormTextInput
                    label="Mobile Money Phone Number"
                    required
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    value={phone}
                    placeholder={paymentCurrency === 'ITX' ? '0111777770' : '077 123 4567'}
                    leadingIcon={
                      <Smartphone aria-hidden="true" className="size-3.5" />
                    }
                    hint={paymentCurrency === 'ITX'
                      ? 'Staging only: use 0111777770 through 0111777779.'
                      : 'Ugandan Mobile Money number starting with 07; network tariffs may apply.'}
                    error={phoneError}
                    containerClassName="mt-4"
                    inputWrapperClassName="h-9"
                    className="text-xs"
                    onChange={handlePhoneChange}
                  />
                </>
              ) : (
                <FormTextInput
                  label="Registered Reader Email Address"
                  required
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  placeholder="reader@domain.com"
                  leadingIcon={
                    <AtSign aria-hidden="true" className="size-3.5" />
                  }
                  hint="Enter the email address used when you paid for this blog."
                  error={emailError}
                  inputWrapperClassName="h-9"
                  className="text-xs"
                  onChange={handleEmailChange}
                />
              )}

              {/* Submit CTA */}
              <Button
                type="submit"
                size="lg"
                disabled={!paymentCurrency && activeTab === 'new-access'}
                className="mt-5 h-10 w-full gap-2 bg-primary text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                <Lock aria-hidden="true" className="size-3.5" />
                <span>
                  {activeTab === 'new-access'
                    ? paymentCurrency === 'ITX'
                      ? 'Run ITX Test Payment & Read Now'
                      : 'Pay via Mobile Money & Read Now'
                    : 'Restore Reading Pass & Read Now'}
                </span>
              </Button>

              {/* Instant Handset Prompt Info Box */}
              {activeTab === 'new-access' && (
                <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-border bg-card/70 p-3 text-[11px] leading-relaxed text-muted-foreground">
                  <Sparkles
                    aria-hidden="true"
                    className="mt-0.5 size-3.5 shrink-0 text-amber-600"
                  />
                  <p>
                    <strong className="font-semibold text-foreground">
                      {paymentCurrency === 'ITX'
                        ? 'iotecPay Test Numbers:'
                        : 'Instant Handset Prompt:'}
                    </strong>{' '}
                    {paymentCurrency === 'ITX'
                      ? 'For staging, use 0111777770 through 0111777779.'
                      : 'After requesting payment, approve the Mobile Money prompt on your phone.'}
                  </p>
                </div>
              )}
            </form>
          </>
        )}
      </Card>
    </div>
  )
}
