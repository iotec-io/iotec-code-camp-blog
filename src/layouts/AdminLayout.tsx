import React, { useEffect, useRef, type ReactNode } from 'react'
import { AdminFooter, AdminHeader, AdminSidebar } from '@/components/admin'
import { useLocation } from '@/navigation/RouterContext'

export interface AdminLayoutProps {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps): React.JSX.Element {
  const drawerRef = useRef<HTMLDialogElement>(null)
  const { pathname } = useLocation()

  useEffect(() => {
    drawerRef.current?.close()
  }, [pathname])

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)')
    const handleDesktopChange = (): void => {
      if (desktop.matches) drawerRef.current?.close()
    }
    desktop.addEventListener('change', handleDesktopChange)
    return () => desktop.removeEventListener('change', handleDesktopChange)
  }, [])

  const handleOpenMenu = (): void => {
    if (!drawerRef.current?.open) drawerRef.current?.showModal()
  }

  const handleCloseMenu = (): void => {
    drawerRef.current?.close()
  }

  const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>): void => {
    if (event.target === event.currentTarget) handleCloseMenu()
  }

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <div className="sticky top-0 hidden h-dvh md:block">
        <AdminSidebar />
      </div>
      <dialog
        ref={drawerRef}
        aria-label="Admin navigation"
        className="fixed inset-0 m-0 h-dvh max-h-dvh w-full max-w-none bg-transparent p-0 text-sidebar-foreground backdrop:bg-black/50 md:hidden"
        onClick={handleBackdropClick}
      >
        <AdminSidebar mobile onClose={handleCloseMenu} />
      </dialog>
      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <AdminHeader onMenuOpen={handleOpenMenu} />
        <main className="flex min-w-0 flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-8">{children}</main>
        <AdminFooter />
      </div>
    </div>
  )
}
