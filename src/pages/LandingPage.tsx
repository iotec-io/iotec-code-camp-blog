import { HeroSection } from '@/components/HeroSection'
import { RecentBlogsSection } from '@/components/RecentBlogsSection'

import {PATHS} from "@/navigation/paths.ts"
import {ArrowRight, ArrowUpRight, Lock} from "lucide-react"
import { Button } from '@/components/ui/button'
import {useNavigate} from "@/navigation/RouterContext.tsx"

export function LandingPage() {
    const navigate = useNavigate()

  return (
    <div className="flex flex-1 flex-col">
      <HeroSection />
      <RecentBlogsSection />

        <div className="flex flex-wrap items-center gap-3">
            <Button
                type="button"
                onClick={() => navigate(PATHS.BLOG_DETAILS)}
                className="px-4 py-2 text-xs font-medium shadow-2xs"
            >
                <span>Read Dispatch</span>
                <ArrowUpRight aria-hidden="true" className="size-3.5" />
            </Button>

            <Button
                type="button"
                variant="outline"
                onClick={() => navigate(PATHS.ADMIN_BLOGS)}
                className="px-4 py-2 text-xs font-medium shadow-2xs"
            >
                <Lock aria-hidden="true" className="size-3.5 text-muted-foreground" />
                <span>Admin Dashboard</span>
                <ArrowRight aria-hidden="true" className="size-3 text-muted-foreground" />
            </Button>
        </div>
    </div>
  )
}

