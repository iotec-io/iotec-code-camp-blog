import { HeroSection } from '@/components/HeroSection'
import { RecentBlogsSection } from '@/components/RecentBlogsSection'
import { useQuery } from "convex/react";
import {api} from "../../convex/_generated/api"

export function LandingPage() {
    const tasks = useQuery(api.tasks.get);
  return (
    <div className="flex flex-1 flex-col">
      <HeroSection />
      <RecentBlogsSection />
    </div>
  )
}
