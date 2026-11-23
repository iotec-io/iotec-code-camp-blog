import React, { useEffect, useMemo, useState } from 'react'
import { useQuery } from 'convex/react'
import { ArrowLeft, FileEdit, Loader2 } from 'lucide-react'
import { api } from '../../convex/_generated/api'
import {BlogContent, BlogHeader, BlogPaywallDialog} from "@/components/blog"
import { Button } from '@/components/ui/button'
import { useLocation, useNavigate } from '@/navigation/RouterContext'
import { PATHS } from '@/navigation/paths'

export function BlogDetailsPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { search } = useLocation()
  const [accessKeys, setAccessKeys] = useState<Record<string, string>>({})
  const [fallbackBlogId, setFallbackBlogId] = useState<string | null>(null)

  const { requestedId, cameFromCreate } = useMemo(() => {
    const params = new URLSearchParams(search)
    return {
      requestedId: params.get('id'),
      cameFromCreate: params.get('from') === 'create',
    }
  }, [search])

  const currentIdentifier = requestedId ?? fallbackBlogId
  const accessKey = currentIdentifier
    ? accessKeys[currentIdentifier] ?? window.localStorage.getItem(`blog-access:${currentIdentifier}`) ?? undefined
    : undefined

  const blog = useQuery(api.blogs.getByIdOrSlug, {
    identifier: requestedId ?? undefined,
    accessKey,
  })

  useEffect(() => {
    if (!requestedId && blog) setFallbackBlogId(blog._id)
  }, [requestedId, blog])

  if (blog === undefined) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center py-24 text-xs text-muted-foreground">
        <Loader2 aria-hidden="true" className="mr-2 size-4 animate-spin text-primary" />
        <span>Loading blog&hellip;</span>
      </div>
    )
  }

  if (blog === null) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-start justify-center py-24">
        <p className="font-serif text-xl text-foreground">Blog not found.</p>
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

  const isUnlocked = blog.hasAccess
  const isLocked = blog.isPaid && !isUnlocked

  const handleUnlockCurrentBlog = (key: string): void => {
    const identifier = requestedId ?? blog._id
    window.localStorage.setItem(`blog-access:${identifier}`, key)
    setAccessKeys((prev) => ({ ...prev, [identifier]: key }))
  }

  // const handleRelockCurrentBlog = () => {
  //   setUnlockedBlogIds((prev) => ({
  //     ...prev,
  //     [blog._id]: false,
  //     ...(requestedId ? { [requestedId]: false } : {}),
  //   }))
  // }

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
                  search: `?editId=${blog._id}`,
                })
              }
              className="gap-1.5 bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-2xs"
            >
              <FileEdit aria-hidden="true" className="size-3.5" />
              <span>Back to Edit</span>
            </Button>
          )}
        </div>

        {/*{blog.isPaid && isUnlocked && (*/}
        {/*  <Button*/}
        {/*    type="button"*/}
        {/*    variant="ghost"*/}
        {/*    size="xs"*/}
        {/*    onClick={handleRelockCurrentBlog}*/}
        {/*    className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"*/}
        {/*  >*/}
        {/*    <Lock aria-hidden="true" className="size-3" />*/}
        {/*    <span>Lock Paywall Preview</span>*/}
        {/*  </Button>*/}
        {/*)}*/}
      </div>

      {/* 1. Article Header (Badges, Read Time, Date, Title, Subtitle, Featured Image, Author) */}
      <BlogHeader blog={blog} isUnlocked={isUnlocked} />

      {/* 2. Rich-Text Article Content (Strictly preview-only HTML from Convex when locked) */}
      <BlogContent html={blog.authorizedHtml} isLocked={isLocked} />

      {/* 3. Paywall Dialog (Displayed when blog is paid and not unlocked) */}
      {isLocked && (
        <BlogPaywallDialog
          blogId={blog._id}
          priceAmount={blog.priceAmount}
          paymentCurrency={blog.paymentCurrency}
          onUnlock={handleUnlockCurrentBlog}
        />
      )}
    </article>
  )
}
