import type { ReactNode } from 'react'
import {AdminFooter, AdminHeader, AdminSidebar} from "@/components/admin"


export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <AdminSidebar />
      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <AdminHeader />
        <main className="flex flex-1 flex-col px-8 py-8">{children}</main>
        <AdminFooter />
      </div>
    </div>
  )
}
