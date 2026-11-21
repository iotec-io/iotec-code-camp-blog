import React from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '../../navigation/RouterContext.tsx'
import { PATHS } from '@/navigation/paths.ts'

export interface AdminHeaderProps {
  onMenuOpen: () => void
}

export function AdminHeader({ onMenuOpen }: AdminHeaderProps): React.JSX.Element {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex items-center gap-3 px-4 py-3.5 sm:px-6 md:px-8">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Open admin navigation"
          className="md:hidden"
          onClick={onMenuOpen}
        >
          <Menu aria-hidden="true" className="size-5" />
        </Button>
        <Link
          to={PATHS.LANDING}
          aria-label="The Tech Report Home"
          className="inline-flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded bg-primary font-serif text-xs font-semibold tracking-wider text-primary-foreground transition-opacity hover:opacity-90"
          >
            TR
          </span>
        </Link>
      </div>
    </header>
  )
}
