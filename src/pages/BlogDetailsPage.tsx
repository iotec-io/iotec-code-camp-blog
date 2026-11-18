import { useMemo, useState } from 'react'
import { ArrowLeft, FileEdit, Loader2, Lock } from 'lucide-react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { BlogArticleHeader } from '@/components/blog/BlogArticleHeader'
import { BlogContent } from '@/components/blog/BlogContent'
import { BlogPaywallDialog } from '@/components/blog/BlogPaywallDialog'
import { Button } from '@/components/ui/button'
import { useLocation, useNavigate } from '@/navigation/RouterContext'
import { PATHS } from '@/navigation/paths'

export function BlogDetailsPage() {
  const navigate = useNavigate()
  const { search } = useLocation()
  const [unlockedBlogIds, setUnlockedBlogIds] = useState<Record<string, boolean>>({})

  const { requestedId, cameFromCreate } = useMemo(() => {
    const params = new URLSearchParams(search)
    return {
      requestedId: params.get('id'),
      cameFromCreate: params.get('from') === 'create',
    }
  }, [search])

  const isReaderUnlocked = Boolean(
    requestedId && unlockedBlogIds[requestedId],
  )

  const blogFromConvex = useQuery(api.blogs.getByIdOrSlug, {
    identifier: requestedId ?? undefined,
    isUnlocked: isReaderUnlocked,
  })

  if (blogFromConvex === undefined) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center py-24 text-xs text-muted-foreground">
        <Loader2 aria-hidden="true" className="mr-2 size-4 animate-spin text-primary" />
        <span>Loading dispatch from Convex&hellip;</span>
      </div>
    )
  }

  if (blogFromConvex === null) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-start justify-center py-24">
        <p className="font-serif text-xl text-foreground">Dispatch not found.</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => navigate(PATHS.LANDING)}
          className="mt-4"
        >
          Back to Landing
        </Button>
      </div>
    )
  }

  const isUnlocked = !blogFromConvex.isPaid || isReaderUnlocked
  const isLocked = blogFromConvex.isPaid && !isUnlocked

  const handleUnlockCurrentBlog = () => {
    setUnlockedBlogIds((prev) => ({
      ...prev,
      [blogFromConvex._id]: true,
      ...(requestedId ? { [requestedId]: true } : {}),
    }))
  }

  const handleRelockCurrentBlog = () => {
    setUnlockedBlogIds((prev) => ({
      ...prev,
      [blogFromConvex._id]: false,
      ...(requestedId ? { [requestedId]: false } : {}),
    }))
  }

  return (
    <article className="mx-auto flex w-full max-w-2xl flex-1 flex-col py-8 sm:py-12">
      {/* Top Navigation & Context Actions */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(PATHS.LANDING)}
            className="bg-white px-3.5 py-1.5 text-xs font-medium shadow-2xs"
          >
            <ArrowLeft
              aria-hidden="true"
              className="size-3.5 text-muted-foreground"
            />
            <span>Back to Landing</span>
          </Button>

          {cameFromCreate && (
            <Button
              type="button"
              size="sm"
              onClick={() =>
                navigate(PATHS.ADMIN_CREATE_BLOG, {
                  search: `?editId=${blogFromConvex._id}`,
                })
              }
              className="gap-1.5 bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-2xs"
            >
              <FileEdit aria-hidden="true" className="size-3.5" />
              <span>Back to Edit</span>
            </Button>
          )}
        </div>

        {blogFromConvex.isPaid && isUnlocked && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={handleRelockCurrentBlog}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Lock aria-hidden="true" className="size-3" />
            <span>Lock Paywall Preview</span>
          </Button>
        )}
      </div>

      {/* 1. Article Header (Badges, Read Time, Date, Title, Subtitle, Featured Image, Author) */}
      <BlogArticleHeader blog={blogFromConvex} isUnlocked={isUnlocked} />

      {/* 2. Rich-Text Article Content (Strictly preview-only HTML from Convex when locked) */}
      <BlogContent html={blogFromConvex.authorizedHtml} isLocked={isLocked} />

      {/* 3. Paywall Dialog (Displayed when blog is paid and not unlocked) */}
      {isLocked && (
        <BlogPaywallDialog
          priceAmount={blogFromConvex.priceAmount}
          onUnlock={handleUnlockCurrentBlog}
        />
      )}
    </article>
  )
}
