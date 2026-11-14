import { useMemo, useState } from 'react'
import { ArrowLeft, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getAuthorizedBlogHtml, MOCK_BLOGS } from '@/data/mockBlogs'
import { useLocation, useNavigate } from '@/navigation/RouterContext'
import { PATHS } from '@/navigation/paths'

export function BlogDetailsPage() {
  const navigate = useNavigate()
  const { search } = useLocation()

  const [unlockedBlogIds, setUnlockedBlogIds] = useState<Record<string, boolean>>({})

  const activeBlog = useMemo(() => {
    const params = new URLSearchParams(search)
    const requestedId = params.get('id')
    if (requestedId) {
      const found = MOCK_BLOGS.find((blog) => blog.id === requestedId)
      if (found) return found
    }
    return MOCK_BLOGS[0]
  }, [search])

  const isUnlocked = !activeBlog.isPaid || Boolean(unlockedBlogIds[activeBlog.id])



  const handleRelockCurrentBlog = () => {
    setUnlockedBlogIds((prev) => ({
      ...prev,
      [activeBlog.id]: false,
    }))
  }

  return (
    <article className="mx-auto flex w-full max-w-2xl flex-1 flex-col py-8 sm:py-12">
      {/* Top Navigation & Demo Controls */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => navigate(PATHS.LANDING)}
          className="bg-white px-3.5 py-1.5 text-xs font-medium shadow-2xs"
        >
          <ArrowLeft aria-hidden="true" className="size-3.5 text-muted-foreground" />
          <span>Back to Landing</span>
        </Button>

        {activeBlog.isPaid && isUnlocked && (
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


      {/* 2. Rich-Text Article Content (Strictly preview-only HTML when locked) */}


      {/* 3. Paywall Dialog (Displayed when blog is paid and not unlocked) */}

    </article>
  )
}
