import { AdminContainer } from '@/components/admin'

export function AdminTransactionsPage() {
  return (
    <AdminContainer
      title="Transactions"
      subtitle="Monitor reader micro-patronage, Mobile Money settlements, and revenue records."
    >
      <div className="my-auto py-16">
        <p className="text-sm text-muted-foreground">
          Subscriber patronage and transaction records will appear here.
        </p>
      </div>
    </AdminContainer>
  )
}
