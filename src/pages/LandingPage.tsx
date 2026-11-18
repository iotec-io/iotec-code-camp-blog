import { HeroSection } from '@/components/HeroSection'
import { RecentBlogsSection } from '@/components/RecentBlogsSection'

export function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <HeroSection />
      <RecentBlogsSection />
    </div>
  )
}
