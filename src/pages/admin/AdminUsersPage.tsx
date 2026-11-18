import { AdminContainer } from '@/components/admin'

export function AdminUsersPage() {
  return (
    <AdminContainer
      title="Subscribers"
      subtitle="Manage registered readers, lifetime dispatch passes, and contributor accounts."
    >
      <div className="my-auto py-16">
        <p className="text-sm text-muted-foreground">
          Registered readers and contributor accounts will appear here.
        </p>
      </div>
    </AdminContainer>
  )
}
