import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import {
  AlertCircle,
  AtSign,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Lock,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from '@/components/ui/toaster'

type AccessTab = 'new-access' | 'restore-access'
type MobileNetwork = 'mtn' | 'airtel'
type PaywallSessionStatus = 'idle' | 'processing' | 'success' | 'error'
type MockOutcomeMode = 'approve' | 'fail'

interface BlogPaywallDialogProps {
  priceAmount: string
  onUnlock: () => void
}

export function BlogPaywallDialog({ priceAmount, onUnlock }: BlogPaywallDialogProps) {
  const emailInputId = useId()
  const phoneInputId = useId()
  const emailHintId = useId()
  const phoneHintId = useId()

  const [activeTab, setActiveTab] = useState<AccessTab>('new-access')
  const [selectedNetwork, setSelectedNetwork] = useState<MobileNetwork>('mtn')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const [sessionStatus, setSessionStatus] = useState<PaywallSessionStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [mockOutcome, setMockOutcome] = useState<MockOutcomeMode>('approve')

  const ussdTimerRef = useRef<number | null>(null)
  const unlockTimerRef = useRef<number | null>(null)

  const clearTimers = () => {
    if (ussdTimerRef.current !== null) {
      window.clearTimeout(ussdTimerRef.current)
      ussdTimerRef.current = null
    }
    if (unlockTimerRef.current !== null) {
      window.clearTimeout(unlockTimerRef.current)
      unlockTimerRef.current = null
    }
  }

  useEffect(() => {
    return () => clearTimers()
  }, [])

  const networkLabel = selectedNetwork === 'mtn' ? 'MTN MoMo' : 'Airtel Money'

  const completeWithSuccess = () => {
    clearTimers()
    setErrorMessage(null)
    setSessionStatus('success')

    toast.success(
      'Mobile Money Payment Confirmed',
      `Your ${priceAmount} contribution via ${networkLabel} was approved. Full essay unlocked.`,
    )

    unlockTimerRef.current = window.setTimeout(() => {
      onUnlock()
    }, 1500)
  }

  const completeWithFailure = (customReason?: string) => {
    clearTimers()
    const reason =
      customReason ??
      `The ${networkLabel} USSD session timed out or was declined on the handset. No funds were deducted—please try again.`

    setErrorMessage(reason)
    setSessionStatus('error')

    toast.error('USSD Authorization Failed', reason)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (sessionStatus === 'processing' || sessionStatus === 'success') return

    const trimmedEmail = email.trim()
    const trimmedPhone = phone.replace(/\D/g, '')

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      completeWithFailure(
        'Please enter a valid email address so we can issue and restore your reading pass.',
      )
      return
    }

    if (activeTab === 'new-access' && trimmedPhone.length < 7) {
      completeWithFailure(
        'Please enter a valid Mobile Money phone number (e.g., 77 123 4567) to trigger the handset USSD prompt.',
      )
      return
    }

    setErrorMessage(null)
    setSessionStatus('processing')

    ussdTimerRef.current = window.setTimeout(() => {
      if (mockOutcome === 'fail') {
        completeWithFailure()
      } else {
        completeWithSuccess()
      }
    }, 3200)
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
              onClick={() => setErrorMessage(null)}
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
          Support Independent Writing &amp; Unlock Full Essay
        </h2>

        <p className="mx-auto mt-2 max-w-md text-center text-xs leading-relaxed text-muted-foreground">
          Access this complete 4,200-word deep-dive, annotated system blueprints,
          and complete archival essays with instant Mobile Money authorization.
        </p>

        {/* Contribution Price Pill */}
        <div className="mx-auto mt-4 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-amber-200/80 bg-amber-50/60 px-4 py-1.5">
          <span className="text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            One-Time Reader Contribution
          </span>
          <span className="font-serif text-sm font-bold text-amber-700">
            {priceAmount}
          </span>
        </div>

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
              Waiting for USSD Confirmation on Handset&hellip;
            </p>
            <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
              A secure <strong className="text-foreground">{networkLabel}</strong> push
              prompt for <strong className="text-foreground">{priceAmount}</strong> has
              been sent to{' '}
              <strong className="text-foreground">
                +256 {phone.trim() || '77 123 4567'}
              </strong>
              . Please enter your Mobile Money PIN on your phone.
            </p>

            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-medium text-primary">
              <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
              <span>Listening for instant settlement callback&hellip;</span>
            </div>

            {/* Interactive Simulation Controls for Testing Both Outcomes Immediately */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 border-t border-border/80 pt-4">
              <span className="w-full text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                Mock USSD Handset Response:
              </span>
              <Button
                type="button"
                size="xs"
                onClick={completeWithSuccess}
                className="bg-emerald-600 px-3 text-white hover:bg-emerald-700"
              >
                Approve PIN (Success)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => completeWithFailure()}
                className="border-red-200 bg-white px-3 text-red-700 hover:bg-red-50"
              >
                Decline / Timeout (Fail)
              </Button>
            </div>
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
              Your lifetime reading pass is linked to{' '}
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
                onClick={() => setActiveTab('new-access')}
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
                onClick={() => setActiveTab('restore-access')}
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
              {activeTab === 'new-access' && (
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold tracking-[0.08em] text-foreground/80 uppercase">
                      Select Mobile Money Network
                    </span>
                    <span className="text-[9px] font-semibold tracking-[0.08em] text-amber-600 uppercase">
                      Instant Handset Push
                    </span>
                  </div>

                  <div
                    role="radiogroup"
                    aria-label="Mobile Money network"
                    className="mt-2 grid grid-cols-2 gap-2.5"
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selectedNetwork === 'mtn'}
                      onClick={() => setSelectedNetwork('mtn')}
                      className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border py-3 text-xs transition-all ${
                        selectedNetwork === 'mtn'
                          ? 'border-primary bg-primary/5 font-semibold text-foreground shadow-2xs'
                          : 'border-border bg-card/60 font-medium text-muted-foreground hover:bg-card'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className="size-2.5 rounded-full bg-amber-400"
                      />
                      <span>MTN MoMo</span>
                    </button>

                    <button
                      type="button"
                      role="radio"
                      aria-checked={selectedNetwork === 'airtel'}
                      onClick={() => setSelectedNetwork('airtel')}
                      className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border py-3 text-xs transition-all ${
                        selectedNetwork === 'airtel'
                          ? 'border-primary bg-primary/5 font-semibold text-foreground shadow-2xs'
                          : 'border-border bg-card/60 font-medium text-muted-foreground hover:bg-card'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className="size-2.5 rounded-full bg-red-500"
                      />
                      <span>Airtel Money</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div className="mt-4">
                <label
                  htmlFor={emailInputId}
                  className="block text-[11px] font-semibold text-foreground"
                >
                  Your Email Address
                </label>
                <div className="mt-1.5 flex h-9 items-center gap-2 rounded-lg border border-border bg-card/70 px-3 focus-within:border-primary focus-within:bg-white">
                  <AtSign
                    aria-hidden="true"
                    className="size-3.5 shrink-0 text-muted-foreground"
                  />
                  <input
                    id={emailInputId}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="reader@domain.com"
                    aria-describedby={emailHintId}
                    className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
                  />
                </div>
                <p id={emailHintId} className="mt-1 text-[10px] text-muted-foreground">
                  Used to securely associate and restore your lifetime reading pass.
                </p>
              </div>

              {/* Phone Number Field (Only for New Access) */}
              {activeTab === 'new-access' && (
                <div className="mt-4">
                  <label
                    htmlFor={phoneInputId}
                    className="block text-[11px] font-semibold text-foreground"
                  >
                    Mobile Money Phone Number
                  </label>
                  <div className="mt-1.5 flex h-9 items-center overflow-hidden rounded-lg border border-border bg-card/70 focus-within:border-primary focus-within:bg-white">
                    <div className="flex h-full shrink-0 items-center gap-1.5 border-r border-border px-3 text-xs font-semibold text-foreground">
                      <span>+256 (UG)</span>
                      <ChevronDown
                        aria-hidden="true"
                        className="size-3 text-muted-foreground"
                      />
                    </div>
                    <div className="flex flex-1 items-center gap-2 px-3">
                      <Smartphone
                        aria-hidden="true"
                        className="size-3.5 shrink-0 text-muted-foreground"
                      />
                      <input
                        id={phoneInputId}
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel-national"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="77 123 4567"
                        aria-describedby={phoneHintId}
                        className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
                      />
                    </div>
                  </div>
                  <p id={phoneHintId} className="mt-1 text-[10px] text-muted-foreground">
                    Direct authorization; standard network tariffs apply.
                  </p>
                </div>
              )}

              {/* Mock USSD Outcome Toggle for Testing */}
              <div className="mt-4 flex items-center justify-between rounded-lg border border-dashed border-border bg-card/40 px-3 py-2 text-[11px]">
                <span className="text-muted-foreground">
                  Simulated USSD Result:
                </span>
                <div className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setMockOutcome('approve')}
                    className={`cursor-pointer rounded px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                      mockOutcome === 'approve'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Succeed
                  </button>
                  <button
                    type="button"
                    onClick={() => setMockOutcome('fail')}
                    className={`cursor-pointer rounded px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                      mockOutcome === 'fail'
                        ? 'bg-red-100 text-red-800'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Fail
                  </button>
                </div>
              </div>

              {/* Submit CTA */}
              <Button
                type="submit"
                size="lg"
                className="mt-4 h-10 w-full gap-2 bg-primary text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                <Lock aria-hidden="true" className="size-3.5" />
                <span>
                  {activeTab === 'new-access'
                    ? 'Pay via Mobile Money & Read Now'
                    : 'Restore Reading Pass & Read Now'}
                </span>
              </Button>

              {/* Instant Handset Prompt Info Box */}
              <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-border bg-card/70 p-3 text-[11px] leading-relaxed text-muted-foreground">
                <Sparkles
                  aria-hidden="true"
                  className="mt-0.5 size-3.5 shrink-0 text-amber-600"
                />
                <p>
                  <strong className="font-semibold text-foreground">
                    Instant Handset Prompt:
                  </strong>{' '}
                  After clicking, a secure USSD pop-up will appear immediately on your
                  device. Enter your secret Mobile Money PIN to approve the transaction.
                </p>
              </div>
            </form>
          </>
        )}

        {/* Bottom Trust Metadata Bar */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-card/50 px-3.5 py-2.5 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck aria-hidden="true" className="size-3 text-amber-600" />
            <span>100% direct creator funding. No recurring subscription traps.</span>
          </span>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Lock aria-hidden="true" className="size-2.5" />
              <span>256-bit TLS</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Zap aria-hidden="true" className="size-2.5" />
              <span>Instant Settlement</span>
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}
