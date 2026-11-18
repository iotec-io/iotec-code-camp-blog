import {HeroSection, RecentBlogsSection} from "@/components/landing"

export function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <HeroSection />
      <RecentBlogsSection />
    </div>
  )
}
