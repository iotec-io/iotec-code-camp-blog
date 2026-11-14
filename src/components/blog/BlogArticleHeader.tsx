import { Clock, Sparkles } from 'lucide-react'
import authorAvatarImg from '@/assets/portrait.webp'
import { Card } from '@/components/ui/card'
import type { BlogPost } from '@/data/mockBlogs'

interface BlogArticleHeaderProps {
  blog: BlogPost
  isUnlocked: boolean
}

export function BlogArticleHeader({ blog, isUnlocked }: BlogArticleHeaderProps) {
  return (
    <header className="flex flex-col">
      {/* Top Meta Row: Badges & Read Time / Date */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {blog.isPaid ? (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200/80 bg-amber-50/90 px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-amber-800 uppercase">
              <Sparkles aria-hidden="true" className="size-3 text-amber-600" />
              <span>
                {isUnlocked ? 'Subscriber Exclusive · Unlocked' : 'Subscriber Exclusive'}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200/80 bg-emerald-50/90 px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-emerald-800 uppercase">
              <span>Free Dispatch</span>
            </span>
          )}

          <span className="inline-flex items-center rounded-md border border-primary/20 bg-primary/8 px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-primary uppercase">
            {blog.badgeLabel}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock aria-hidden="true" className="size-3.5 shrink-0" />
          <span>{blog.readTime}</span>
          <span aria-hidden="true">&middot;</span>
          <time>{blog.date}</time>
        </div>
      </div>

      {/* Title */}
      <h1 className="mt-5 font-serif text-3xl leading-[1.15] font-normal tracking-tight text-foreground sm:text-4xl lg:text-[42px]">
        {blog.title}
      </h1>

      {/* Subtitle */}
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
        {blog.subtitle}
      </p>

      {/* Featured Blog Image Below Subtitle */}
      <figure className="mt-6">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xs">
          <img
            src={blog.imageUrl}
            alt={blog.imageAlt}
            fetchPriority="high"
            width={880}
            height={460}
            className="aspect-16/9 w-full object-cover"
          />
        </div>
        <figcaption className="mt-2.5 flex items-center justify-center gap-2 text-center text-[11px] text-muted-foreground">
          <span
            aria-hidden="true"
            className="inline-block size-1.5 shrink-0 rounded-full bg-amber-500"
          />
          <span>{blog.imageCaption}</span>
        </figcaption>
      </figure>

      {/* Author Attribution Card */}
      <Card className="mt-6 flex flex-row items-center gap-3.5 rounded-xl border-border bg-card/80 px-4 py-3 shadow-none">
        <img
          src={authorAvatarImg}
          alt={blog.author.name}
          width={40}
          height={40}
          className="size-10 shrink-0 rounded-lg object-cover"
        />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground">{blog.author.name}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {blog.author.role}
          </p>
        </div>
      </Card>
    </header>
  )
}

