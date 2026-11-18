import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from 'convex/react'
import {
  Clock,
  Eye,
  Loader2,
  Lock,
  Radio,
  Save,
  Sparkles,
  Tag,
  Unlock,
} from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import {
  FormImageUploadInput,
  FormRadioCardGroup,
  FormRichTextInput,
  FormSelectInput,
  FormTextareaInput,
  FormTextInput,
  type RadioCardOption,
  type SelectOption,
} from '@/components/form'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from '@/components/ui/toaster'
import { useLocation, useNavigate } from '@/navigation/RouterContext'
import { PATHS } from '@/navigation/paths'

const MAX_TITLE_LENGTH = 100
const MAX_SUBTITLE_LENGTH = 250
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/webp', 'image/jpeg', 'image/png']

function stripHtmlToText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseCommaSeparatedTags(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  )
}

const createBlogSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Blog title is required.')
      .min(5, 'Blog title must be at least 5 characters.')
      .max(
        MAX_TITLE_LENGTH,
        `Blog title cannot exceed ${MAX_TITLE_LENGTH} characters.`,
      ),
    subtitle: z
      .string()
      .trim()
      .min(1, 'Subtitle is required.')
      .min(10, 'Subtitle must be at least 10 characters.')
      .max(
        MAX_SUBTITLE_LENGTH,
        `Subtitle cannot exceed ${MAX_SUBTITLE_LENGTH} characters.`,
      ),
    category: z.enum(['Architecture', 'Technology'], {
      message: 'Please select a category.',
    }),
    tagsInput: z
      .string()
      .trim()
      .min(1, 'Please enter at least one tag (comma-separated).')
      .refine((val) => parseCommaSeparatedTags(val).length >= 1, {
        message: 'Please enter at least one valid tag.',
      }),
    subscriptionMode: z.enum(['free', 'paid']),
    priceUgx: z
      .number({ message: 'Enter a valid price in UGX.' })
      .min(0, 'Price cannot be negative.'),
    coverImageCheck: z.string().min(1, 'A cover artwork image is required.'),
    coverFileSize: z
      .number()
      .max(MAX_IMAGE_SIZE_BYTES, 'Cover image file size must not exceed 5MB.'),
    bodyHtml: z
      .string()
      .refine((val) => stripHtmlToText(val).length >= 20, {
        message: 'Manuscript body text is required (at least 20 characters).',
      }),
  })
  .refine(
    (data) => data.subscriptionMode === 'free' || data.priceUgx >= 500,
    {
      message: 'Paid dispatches require a minimum price of UGX 500.',
      path: ['priceUgx'],
    },
  )

type CreateBlogFormValues = z.infer<typeof createBlogSchema>

const CATEGORY_OPTIONS: readonly SelectOption<'Architecture' | 'Technology'>[] = [
  { value: 'Architecture', label: 'Architecture' },
  { value: 'Technology', label: 'Technology' },
]

const SUBSCRIPTION_MODE_OPTIONS: readonly RadioCardOption<'free' | 'paid'>[] = [
  {
    value: 'free',
    label: 'Free',
    icon: <Unlock aria-hidden="true" className="size-3.5" />,
    activeClassName:
      'border-primary bg-primary/8 font-semibold text-primary shadow-2xs',
  },
  {
    value: 'paid',
    label: 'Paid',
    icon: <Lock aria-hidden="true" className="size-3.5" />,
    activeClassName:
      'border-amber-400 bg-amber-50/70 font-semibold text-amber-800 shadow-2xs',
  },
]

const PRICE_PRESETS = [2500, 5000, 10000] as const

function formatBytesToMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function CreateBlogPage() {
  const navigate = useNavigate()
  const { search } = useLocation()

  const searchParams = new URLSearchParams(search)
  const initialEditId = searchParams.get('editId')

  const [savedBlogId, setSavedBlogId] = useState<Id<'blogs'> | null>(
    initialEditId ? (initialEditId as Id<'blogs'>) : null,
  )
  const [coverImageStorageId, setCoverImageStorageId] = useState<
    Id<'_storage'> | undefined
  >(undefined)
  const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>(
    undefined,
  )
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null)
  const [coverFileName, setCoverFileName] = useState<string>('')
  const [coverDimensions, setCoverDimensions] = useState<string>('2400 × 1350')
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isZenMode, setIsZenMode] = useState(false)
  const [hydratedEditId, setHydratedEditId] = useState<string | null>(null)

  const generateUploadUrl = useMutation(api.blogs.generateUploadUrl)
  const saveBlogMutation = useMutation(api.blogs.saveBlog)

  const existingDraft = useQuery(
    api.blogs.getByIdOrSlug,
    initialEditId
      ? { identifier: initialEditId, isUnlocked: true, includeFullForEdit: true }
      : 'skip',
  )

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm<CreateBlogFormValues>({
    resolver: zodResolver(createBlogSchema),
    mode: 'onTouched',
    defaultValues: {
      title: '',
      subtitle: '',
      category: 'Architecture',
      tagsInput: 'Systems & Craft, Archival Dispatch',
      subscriptionMode: 'free',
      priceUgx: 5000,
      coverImageCheck: '',
      coverFileSize: 0,
      bodyHtml: '',
    },
  })

  const watchedTitle = watch('title')
  const watchedSubtitle = watch('subtitle')
  const watchedTagsInput = watch('tagsInput')
  const watchedSubscriptionMode = watch('subscriptionMode')
  const watchedPriceUgx = watch('priceUgx')
  const watchedBodyHtml = watch('bodyHtml')
  const watchedCoverFileSize = watch('coverFileSize')
  const watchedCategory = watch('category')

  const parsedTags = parseCommaSeparatedTags(watchedTagsInput)

  // Hydrate form if returning to edit an existing draft/blog
  useEffect(() => {
    if (existingDraft && existingDraft._id !== hydratedEditId) {
      setSavedBlogId(existingDraft._id)
      setValue('title', existingDraft.title)
      setValue('subtitle', existingDraft.subtitle)
      setValue('category', existingDraft.category)
      setValue(
        'tagsInput',
        existingDraft.tags && existingDraft.tags.length > 0
          ? existingDraft.tags.join(', ')
          : existingDraft.badgeLabel,
      )
      setValue('subscriptionMode', existingDraft.subscriptionMode)
      setValue(
        'priceUgx',
        existingDraft.price.amount > 0 ? existingDraft.price.amount : 5000,
      )

      const resolvedHtml =
        existingDraft.fullContentHtmlForEdit ?? existingDraft.authorizedHtml
      setValue('bodyHtml', resolvedHtml)

      if (existingDraft.coverImageStorageId) {
        setCoverImageStorageId(existingDraft.coverImageStorageId)
      }
      setCoverImageUrl(existingDraft.coverImageUrl)
      setCoverPreviewUrl(existingDraft.coverImageUrl)
      setCoverFileName(
        existingDraft.coverImageData.fileName ?? 'archival_cover_plate.webp',
      )
      setCoverDimensions(
        existingDraft.coverImageData.dimensions ?? '2560 × 1440',
      )
      setValue('coverImageCheck', existingDraft.coverImageUrl)
      setValue(
        'coverFileSize',
        existingDraft.coverImageData.fileSize ?? 1024 * 1024,
      )
      setHydratedEditId(existingDraft._id)
    }
  }, [existingDraft, hydratedEditId, setValue])

  const processSelectedFile = async (file: File) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError('coverImageCheck', {
        type: 'manual',
        message: 'Unsupported format. Please upload a WebP, JPG, or PNG image.',
      })
      toast.error(
        'Invalid Image Format',
        'Supported formats are WebP, JPG, and PNG only.',
      )
      return
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setValue('coverFileSize', file.size, { shouldValidate: true })
      setError('coverImageCheck', {
        type: 'manual',
        message: `File size (${formatBytesToMb(file.size)}) exceeds the 5MB maximum limit.`,
      })
      toast.error(
        'Image Exceeds 5MB Limit',
        `Selected file is ${formatBytesToMb(file.size)}. Please choose an image under 5MB.`,
      )
      return
    }

    clearErrors(['coverImageCheck', 'coverFileSize'])
    setIsUploadingImage(true)

    try {
      const localPreview = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        setCoverDimensions(`${img.naturalWidth} × ${img.naturalHeight}`)
      }
      img.src = localPreview

      const postUrl = await generateUploadUrl()
      const response = await fetch(postUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      if (!response.ok) {
        throw new Error('Failed to upload image to Convex storage.')
      }

      const json = (await response.json()) as { storageId: Id<'_storage'> }
      setCoverImageStorageId(json.storageId)
      setCoverImageUrl(undefined)
      setCoverPreviewUrl(localPreview)
      setCoverFileName(file.name)
      setValue('coverImageCheck', json.storageId, { shouldValidate: true })
      setValue('coverFileSize', file.size, { shouldValidate: true })

      toast.success(
        'Cover Artwork Uploaded',
        `${file.name} (${formatBytesToMb(file.size)}) processed and ready.`,
      )
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'Could not upload cover image.'
      setError('coverImageCheck', { type: 'manual', message: msg })
      toast.error('Upload Failed', msg)
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleRemoveImage = () => {
    setCoverImageStorageId(undefined)
    setCoverImageUrl(undefined)
    setCoverPreviewUrl(null)
    setCoverFileName('')
    setValue('coverImageCheck', '', { shouldValidate: true })
    setValue('coverFileSize', 0, { shouldValidate: true })
  }

  const persistBlogToConvex = async (
    values: CreateBlogFormValues,
    targetStatus: 'draft' | 'published',
  ) => {
    const normalizedTags = parseCommaSeparatedTags(values.tagsInput)

    const result = await saveBlogMutation({
      blogId: savedBlogId ?? undefined,
      title: values.title,
      subtitle: values.subtitle,
      category: values.category,
      tags: normalizedTags,
      subscriptionMode: values.subscriptionMode,
      price: {
        amount: values.subscriptionMode === 'paid' ? values.priceUgx : 0,
        currency: 'UGX',
      },
      status: targetStatus,
      fullContentHtml: values.bodyHtml,
      coverImageStorageId,
      coverImageUrl,
      coverImageData: {
        alt: values.title,
        caption: `${values.title} — Archival Plate, The Tech Report`,
        fileName: coverFileName || 'cover_plate.webp',
        fileSize: values.coverFileSize,
        dimensions: coverDimensions,
      },
    })

    setSavedBlogId(result.blogId)
    return result
  }

  const onValidationError = () => {
    toast.error(
      'Validation Error',
      'Please complete all required fields and resolve the highlighted errors before saving.',
    )
  }

  const handleSaveAsDraft = handleSubmit(async (values) => {
    setIsSavingDraft(true)
    try {
      const result = await persistBlogToConvex(values, 'draft')
      navigate(PATHS.ADMIN_CREATE_BLOG, {
        replace: true,
        search: `?editId=${result.blogId}`,
      })
      toast.success(
        'Saved as Draft',
        'Your working copy has been saved to Convex in draft state.',
      )
    } catch (error) {
      toast.error(
        'Could Not Save Draft',
        error instanceof Error ? error.message : 'An unexpected error occurred.',
      )
    } finally {
      setIsSavingDraft(false)
    }
  }, onValidationError)

  const handlePreviewDraft = handleSubmit(async (values) => {
    setIsPreviewing(true)
    try {
      const result = await persistBlogToConvex(values, 'draft')
      toast.success(
        'Draft Saved for Preview',
        'Opening reader preview from your saved draft...',
      )
      navigate(PATHS.BLOG_DETAILS, {
        search: `?id=${result.blogId}&from=create`,
      })
    } catch (error) {
      toast.error(
        'Preview Failed',
        error instanceof Error ? error.message : 'Could not save draft for preview.',
      )
    } finally {
      setIsPreviewing(false)
    }
  }, onValidationError)

  const handlePublishArticle = handleSubmit(async (values) => {
    setIsPublishing(true)
    try {
      const result = await persistBlogToConvex(values, 'published')
      toast.success(
        'Article Published',
        `"${values.title}" is now live on the landing page archive.`,
      )
      navigate(PATHS.BLOG_DETAILS, {
        search: `?id=${result.blogId}&from=create`,
      })
    } catch (error) {
      toast.error(
        'Publish Failed',
        error instanceof Error ? error.message : 'Could not publish article.',
      )
    } finally {
      setIsPublishing(false)
    }
  }, onValidationError)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col">
      {/* Top Page Header & Action Bar */}
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-normal tracking-tight text-foreground sm:text-4xl">
            Create Blog
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-amber-800 uppercase">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-amber-600"
              />
              <span>Draft Mode</span>
            </span>
            <span className="text-xs text-muted-foreground">
              Unpublished Working Copy
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            disabled={isSavingDraft || isPreviewing || isPublishing}
            onClick={handleSaveAsDraft}
            className="h-9 gap-2 bg-white px-3.5 text-xs font-medium shadow-2xs"
          >
            {isSavingDraft ? (
              <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
            ) : (
              <Save aria-hidden="true" className="size-3.5 text-muted-foreground" />
            )}
            <span>Save as Draft</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={isSavingDraft || isPreviewing || isPublishing}
            onClick={handlePreviewDraft}
            className="h-9 gap-2 bg-white px-3.5 text-xs font-medium shadow-2xs"
          >
            {isPreviewing ? (
              <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
            ) : (
              <Eye aria-hidden="true" className="size-3.5 text-muted-foreground" />
            )}
            <span>Preview</span>
          </Button>

          <Button
            type="button"
            disabled={isSavingDraft || isPreviewing || isPublishing}
            onClick={handlePublishArticle}
            className="h-9 gap-2 bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90"
          >
            {isPublishing ? (
              <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
            ) : (
              <Radio aria-hidden="true" className="size-3.5" />
            )}
            <span>Publish Article</span>
          </Button>
        </div>
      </div>

      {/* Main Two-Column Grid Layout */}
      <div className="mt-7 grid grid-cols-1 items-start gap-7 lg:grid-cols-12">
        {/* Left Column: Manuscript Editor Card */}
        <Card
          className={`gap-0 rounded-2xl border-border bg-white p-6 shadow-xs sm:p-8 ${isZenMode ? 'lg:col-span-12' : 'lg:col-span-8'
            }`}
        >
          {/* Card Top Metadata Strip with Reusable Dropdown Option Input */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-4">
            <div className="flex items-center gap-3">
              <span className="rounded border border-border bg-card px-2 py-0.5 text-[10px] font-semibold tracking-[0.1em] text-foreground uppercase">
                Monograph Draft
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock aria-hidden="true" className="size-3" />
                <span>
                  {savedBlogId ? 'Saved in Convex' : 'Unsaved working copy'}
                </span>
              </span>
            </div>

            <FormSelectInput
              inline
              label="Category:"
              options={CATEGORY_OPTIONS}
              value={watchedCategory}
              onChange={(val) =>
                setValue('category', val, { shouldValidate: true })
              }
              error={errors.category?.message}
            />
          </div>

          {/* 1. Reusable Text Input: Blog Title */}
          <FormTextInput
            label="Blog Title"
            required
            placeholder="e.g. Distributed Consensus in Equatorial Topographies"
            counter={{ current: watchedTitle.length, max: MAX_TITLE_LENGTH }}
            hint="A concise, definitive title set in our editorial headline style."
            error={errors.title?.message}
            containerClassName="mt-6"
            className="h-12 font-serif text-lg"
            {...register('title')}
          />

          {/* 2. Reusable Textarea Input: Subtitle */}
          <FormTextareaInput
            label="Subtitle"
            required
            rows={3}
            placeholder="Summarize the core thesis, fieldwork constraints, or architectural implications in one or two deliberate sentences..."
            counter={{
              current: watchedSubtitle.length,
              max: MAX_SUBTITLE_LENGTH,
            }}
            hint="Displays directly beneath the cover art on the reader dispatch feed."
            error={errors.subtitle?.message}
            containerClassName="mt-6"
            className="text-xs leading-relaxed"
            {...register('subtitle')}
          />

          {/* 3. Reusable Text Input: Comma-Separated Tags */}
          <div className="mt-6">
            <FormTextInput
              label="Tags (Comma-separated)"
              required
              placeholder="e.g. Systems & Craft, Longevity, Distributed Systems"
              leadingIcon={<Tag aria-hidden="true" className="size-3.5" />}
              rightLabel={`${parsedTags.length} ${parsedTags.length === 1 ? 'tag' : 'tags'}`}
              hint="Separate multiple archival tags with commas. The first tag appears as the primary dispatch badge."
              error={errors.tagsInput?.message}
              className="text-xs"
              {...register('tagsInput')}
            />

            {parsedTags.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {parsedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-md border border-primary/20 bg-primary/8 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-primary uppercase"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 4. Reusable Image Upload Input: Cover Artwork / Plate */}
          <FormImageUploadInput
            label="Cover Artwork / Plate"
            required
            isUploading={isUploadingImage}
            previewUrl={coverPreviewUrl}
            fileName={coverFileName}
            fileSizeBytes={watchedCoverFileSize}
            dimensions={coverDimensions}
            error={
              errors.coverImageCheck?.message ?? errors.coverFileSize?.message
            }
            onSelectFile={(file) => void processSelectedFile(file)}
            onRemoveFile={handleRemoveImage}
            containerClassName="mt-6"
          />

          {/* 5. Reusable Rich Text Editor Input: Manuscript & Body Text */}
          <FormRichTextInput
            label="Manuscript & Body Text"
            required
            value={watchedBodyHtml}
            onChange={(html) =>
              setValue('bodyHtml', html, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
            error={errors.bodyHtml?.message}
            isZenMode={isZenMode}
            onToggleZenMode={() => setIsZenMode((prev) => !prev)}
            containerClassName="mt-6"
          />
        </Card>

        {/* Right Column: Monetization & Tier Sidebar Card */}
        {!isZenMode && (
          <Card className="gap-0 rounded-2xl border-border bg-white p-6 shadow-xs lg:col-span-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-amber-200/80 bg-amber-50 text-amber-700">
                <Sparkles aria-hidden="true" className="size-4" />
              </div>
              <div>
                <h2 className="font-serif text-lg leading-snug font-medium text-foreground">
                  Monetization &amp; Tier
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Reader access &amp; paywall settings
                </p>
              </div>
            </div>

            {/* Reusable Radio Card Group: Subscription Mode (Free by default) */}
            <FormRadioCardGroup
              label="Subscription mode"
              options={SUBSCRIPTION_MODE_OPTIONS}
              value={watchedSubscriptionMode}
              onChange={(mode) =>
                setValue('subscriptionMode', mode, { shouldValidate: true })
              }
              containerClassName="mt-6"
            />

            {/* Reusable Text Input with Currency Addon: Price in UGX */}
            <div
              className={`mt-5 rounded-xl border border-border bg-card/70 p-4 transition-opacity ${watchedSubscriptionMode === 'free' ? 'opacity-60' : 'opacity-100'
                }`}
            >
              <FormTextInput
                label="Price in UGX"
                rightLabel="One-time read dispatch"
                type="number"
                min={0}
                step={500}
                disabled={watchedSubscriptionMode === 'free'}
                value={watchedSubscriptionMode === 'free' ? 0 : watchedPriceUgx}
                onChange={(e) =>
                  setValue('priceUgx', Number(e.target.value || 0), {
                    shouldValidate: true,
                  })
                }
                startAddon={<span className="text-muted-foreground">UGX</span>}
                error={errors.priceUgx?.message}
                inputWrapperClassName="h-11 bg-white"
                className="font-serif text-lg font-bold"
              />
            </div>

            {/* Presets */}
            <div className="mt-4 flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-muted-foreground">
                Presets:
              </span>
              <div className="grid flex-1 grid-cols-3 gap-1.5">
                {PRICE_PRESETS.map((preset) => {
                  const isActivePreset =
                    watchedSubscriptionMode === 'paid' &&
                    watchedPriceUgx === preset
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setValue('subscriptionMode', 'paid', {
                          shouldValidate: true,
                        })
                        setValue('priceUgx', preset, { shouldValidate: true })
                      }}
                      className={`cursor-pointer rounded-md border py-1.5 text-center text-[10px] leading-tight font-semibold transition-colors ${isActivePreset
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card hover:bg-secondary text-foreground'
                        }`}
                    >
                      {preset.toLocaleString('en-US')}
                      <br />
                      <span className="text-[9px] font-normal text-muted-foreground">
                        UGX
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
