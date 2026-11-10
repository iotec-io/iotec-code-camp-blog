import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MOCK_BLOGS, type BlogCategory, type BlogPostPreview } from '@/data/mockBlogs'
import { useNavigate } from '@/navigation/RouterContext'
import { PATHS } from '@/navigation/paths'

type FilterCategory = 'All' | BlogCategory

const CATEGORIES: readonly FilterCategory[] = ['All', 'Architecture', 'Technology']

function formatStepNumber(num: number): string {
  return String(Math.max(1, num)).padStart(2, '0')
}

function BlogCard({ blog, onRead }: { blog: BlogPostPreview; onRead: () => void }) {
  return (
    <Card className="group flex h-full flex-col gap-0 overflow-hidden rounded-xl border-border bg-white p-0 py-0 shadow-2xs transition-shadow hover:shadow-md">
      <div className="aspect-16/10 w-full overflow-hidden bg-muted">
        <img
          src={blog.imageUrl}
          alt={blog.imageAlt}
          loading="lazy"
          width={450}
          height={280}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {blog.category}
          </span>

          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
              blog.isPaid
                ? 'border-amber-200/80 bg-amber-50 text-amber-800'
                : 'border-emerald-200/80 bg-emerald-50 text-emerald-700'
            }`}
          >
            {blog.priceLabel}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock aria-hidden="true" className="size-3 shrink-0" />
          <span>
            {blog.date} &middot; {blog.readTime}
          </span>
        </div>

        <h3 className="mt-2 font-serif text-[17px] leading-snug font-semibold tracking-tight text-foreground">
          {blog.title}
        </h3>

        <p className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-muted-foreground">
          {blog.excerpt}
        </p>

        <div className="mt-4 border-t border-border/70 pt-3.5">
          <Button
            type="button"
            variant="link"
            size="xs"
            onClick={onRead}
            className="h-auto gap-1.5 p-0 text-xs font-medium text-primary hover:no-underline"
          >
            <span>Read</span>
            <ArrowRight
              aria-hidden="true"
              className="size-3 transition-transform group-hover:translate-x-0.5"
            />
          </Button>
        </div>
      </div>
    </Card>
  )
}

export function RecentBlogsSection() {
  const navigate = useNavigate()
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('All')
  const [isSeeAll, setIsSeeAll] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visibleCards, setVisibleCards] = useState(3)

  const filteredBlogs =
    selectedCategory === 'All'
      ? MOCK_BLOGS
      : MOCK_BLOGS.filter((blog) => blog.category === selectedCategory)

  const updateVisibleCards = useCallback(() => {
    if (typeof window === 'undefined') return
    if (window.innerWidth >= 1024) {
      setVisibleCards(3)
    } else if (window.innerWidth >= 768) {
      setVisibleCards(2)
    } else {
      setVisibleCards(1)
    }
  }, [])

  useEffect(() => {
    updateVisibleCards()
    window.addEventListener('resize', updateVisibleCards)
    return () => window.removeEventListener('resize', updateVisibleCards)
  }, [updateVisibleCards])

  const maxStartIndex = Math.max(0, filteredBlogs.length - visibleCards)
  const totalSteps = maxStartIndex + 1
  const clampedIndex = Math.min(currentIndex, maxStartIndex)

  const scrollToStep = useCallback(
    (targetIndex: number) => {
      const container = scrollContainerRef.current
      if (!container || isSeeAll) return

      const nextIndex = Math.max(0, Math.min(targetIndex, maxStartIndex))
      const cards = container.querySelectorAll<HTMLElement>('[data-carousel-item]')
      const targetCard = cards[nextIndex]

      if (targetCard) {
        container.scrollTo({
          left: targetCard.offsetLeft,
          behavior: 'smooth',
        })
      }
      setCurrentIndex(nextIndex)
    },
    [isSeeAll, maxStartIndex],
  )

  const handleScroll = () => {
    const container = scrollContainerRef.current
    if (!container || isSeeAll) return

    const cards = container.querySelectorAll<HTMLElement>('[data-carousel-item]')
    if (cards.length === 0) return

    const scrollLeft = container.scrollLeft
    let closestIndex = 0
    let minDistance = Number.POSITIVE_INFINITY

    cards.forEach((card, index) => {
      const distance = Math.abs(card.offsetLeft - scrollLeft)
      if (distance < minDistance) {
        minDistance = distance
        closestIndex = index
      }
    })

    setCurrentIndex(Math.min(closestIndex, maxStartIndex))
  }

  const handleCategoryChange = (category: FilterCategory) => {
    setSelectedCategory(category)
    setCurrentIndex(0)
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' })
    }
  }

  const canScrollPrev = !isSeeAll && clampedIndex > 0
  const canScrollNext = !isSeeAll && clampedIndex < maxStartIndex

  return (
    <section className="border-t border-border py-12 sm:py-16">
      {/* Section Header & Controls */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block size-1.5 rounded-full bg-primary"
            />
            <span className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              The Tech Report Archive
            </span>
          </div>
          <h2 className="mt-1.5 font-serif text-2xl font-normal tracking-tight text-foreground sm:text-3xl">
            Recent Blogs
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter Pills */}
          <div
            role="group"
            aria-label="Filter blogs by category"
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1"
          >
            {CATEGORIES.map((category) => {
              const isSelected = selectedCategory === category
              return (
                <Button
                  key={category}
                  type="button"
                  variant={isSelected ? 'default' : 'ghost'}
                  size="xs"
                  onClick={() => handleCategoryChange(category)}
                  aria-pressed={isSelected}
                  className={`h-7 rounded-md px-3 text-xs font-medium ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-2xs'
                      : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
                  }`}
                >
                  {category}
                </Button>
              )
            })}
          </div>

          {/* See All / See Less Buttons */}
          {!isSeeAll ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsSeeAll(true)}
              className="h-8 bg-white px-3 text-xs font-medium shadow-2xs"
            >
              See All
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsSeeAll(false)}
              className="h-8 bg-white px-3 text-xs font-medium shadow-2xs"
            >
              See Less
            </Button>
          )}

          {/* Step Counter & Back / Front Scroll Buttons */}
          <div className="flex items-center gap-2">
            <span className="px-1 font-mono text-[11px] font-medium tracking-wider text-muted-foreground">
              {isSeeAll
                ? `${formatStepNumber(filteredBlogs.length)} / ${formatStepNumber(filteredBlogs.length)}`
                : `${formatStepNumber(clampedIndex + 1)} / ${formatStepNumber(totalSteps)}`}
            </span>

            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={!canScrollPrev}
              onClick={() => scrollToStep(clampedIndex - 1)}
              aria-label="Scroll to previous blog"
              className="size-8 rounded-full border-border bg-white shadow-2xs disabled:opacity-40"
            >
              <ArrowLeft aria-hidden="true" className="size-3.5" />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={!canScrollNext}
              onClick={() => scrollToStep(clampedIndex + 1)}
              aria-label="Scroll to next blog"
              className="size-8 rounded-full border-border bg-white shadow-2xs disabled:opacity-40"
            >
              <ArrowRight aria-hidden="true" className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Blogs Display: Horizontal Carousel (when See All is inactive) vs Expanded Grid (when See All is active) */}
      {isSeeAll ? (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredBlogs.map((blog) => (
            <BlogCard
              key={blog.id}
              blog={blog}
              onRead={() => navigate(PATHS.BLOG_DETAILS)}
            />
          ))}
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="relative mt-8 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 scrollbar-none"
        >
          {filteredBlogs.map((blog) => (
            <div
              key={blog.id}
              data-carousel-item
              className="w-full shrink-0 snap-start md:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]"
            >
              <BlogCard
                blog={blog}
                onRead={() => navigate(PATHS.BLOG_DETAILS)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

