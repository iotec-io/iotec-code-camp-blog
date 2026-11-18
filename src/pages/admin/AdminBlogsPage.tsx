import { useMemo, useState } from 'react'
import { Eye, FilePenLine, Plus, Star } from 'lucide-react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import {
  AdminContainer
} from '@/components/admin'
import {
    BlogStatusChip,
    BlogSummaryCard,
} from '@/components/blog'
import {
    AdminDataTable,
    DEFAULT_ADMIN_TABLE_QUERY,
    TableActionButton,
    type AdminTableColumn,
    type AdminTableFilterConfig,
    type AdminTableQueryState,
} from '@/components/table'
import { useNavigate } from '@/navigation/RouterContext'
import { PATHS } from '@/navigation/paths'

type BlogCategoryFilter = 'Architecture' | 'Technology'
type SubscriptionFilter = 'free' | 'paid'
type StatusFilter = 'published' | 'draft' | 'archived'

export function AdminBlogsPage() {
  const navigate = useNavigate()

  const [tableQuery, setTableQuery] = useState<AdminTableQueryState>(
    DEFAULT_ADMIN_TABLE_QUERY,
  )
  const [selectedCategories, setSelectedCategories] = useState<
    BlogCategoryFilter[]
  >([])
  const [selectedTiers, setSelectedTiers] = useState<SubscriptionFilter[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<StatusFilter[]>([])

  const tableResult = useQuery(api.blogs.listAdminTable, {
    searchQuery: tableQuery.searchQuery.trim() || undefined,
    categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    subscriptionModes: selectedTiers.length > 0 ? selectedTiers : undefined,
    statuses: selectedStatuses.length > 0 ? selectedStatuses : undefined,
    page: tableQuery.page,
    pageSize: tableQuery.pageSize,
  })

  type BlogRow = NonNullable<typeof tableResult>['items'][number]

  const handleResetFilters = () => {
    setSelectedCategories([])
    setSelectedTiers([])
    setSelectedStatuses([])
  }

  const filters: readonly AdminTableFilterConfig[] = useMemo(
    () => [
      {
        id: 'category',
        allLabel: 'All Categories',
        mode: 'multiple',
        options: [
          { value: 'Architecture', label: 'Architecture' },
          { value: 'Technology', label: 'Technology' },
        ],
        selectedValues: selectedCategories,
        onChange: (next) => setSelectedCategories(next as BlogCategoryFilter[]),
      },
      {
        id: 'tier',
        allLabel: 'All Tiers',
        mode: 'single',
        options: [
          { value: 'paid', label: 'Paid' },
          { value: 'free', label: 'Free' },
        ],
        selectedValues: selectedTiers,
        onChange: (next) => setSelectedTiers(next as SubscriptionFilter[]),
      },
      {
        id: 'status',
        allLabel: 'All Statuses',
        mode: 'multiple',
        options: [
          { value: 'published', label: 'Published' },
          { value: 'draft', label: 'Draft' },
          { value: 'archived', label: 'Archived' },
        ],
        selectedValues: selectedStatuses,
        onChange: (next) => setSelectedStatuses(next as StatusFilter[]),
      },
    ],
    [selectedCategories, selectedTiers, selectedStatuses],
  )

  const columns: readonly AdminTableColumn<BlogRow>[] = useMemo(
    () => [
      {
        key: 'date',
        header: 'Date',
        cellClassName: 'whitespace-nowrap text-xs text-muted-foreground',
        render: (blog) => blog.date,
      },
      {
        key: 'title',
        header: 'Title',
        render: (blog) => (
          <p className="max-w-xs truncate font-serif text-[15px] font-normal text-foreground sm:max-w-md">
            {blog.title}
          </p>
        ),
      },
      {
        key: 'category',
        header: 'Category',
        render: (blog) => (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-0.5 text-[11px] font-medium text-primary">
            {blog.category}
          </span>
        ),
      },
      {
        key: 'subscription',
        header: 'Subscription',
        render: (blog) =>
          blog.isPaid ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/90 bg-amber-50/90 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
              <Star
                aria-hidden="true"
                className="size-2.5 text-amber-700"
              />
              <span>Paid</span>
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              Free
            </span>
          ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (blog) => <BlogStatusChip status={blog.status} />,
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        cellClassName: 'whitespace-nowrap',
        render: (blog) => (
          <div className="inline-flex items-center gap-1.5">
            <TableActionButton
              icon={FilePenLine}
              label={`Edit ${blog.title}`}
              onClick={() =>
                navigate(PATHS.ADMIN_CREATE_BLOG, {
                  search: `?editId=${blog._id}`,
                })
              }
            />

            <TableActionButton
              icon={Eye}
              label={`Preview ${blog.title}`}
              onClick={() =>
                navigate(PATHS.BLOG_DETAILS, {
                  search: `?id=${blog._id}&from=create`,
                })
              }
            />
          </div>
        ),
      },
    ],
    [navigate],
  )

  const publishedCount = tableResult?.counts.published ?? 0
  const draftCount = tableResult?.counts.draft ?? 0
  const archivedCount = tableResult?.counts.archived ?? 0

  return (
    <AdminContainer
      title="Blogs"
      subtitle="Manage archived blogs, editorial review drafts, and subscriber access tiers."
      buttons={[
        {
          id: 'create-blog',
          label: 'Create New Blog',
          icon: <Plus aria-hidden="true" className="size-3.5" />,
          onClick: () => navigate(PATHS.ADMIN_CREATE_BLOG),
        },
      ]}
    >
      {/* 3 Status Summary Cards Matching Screenshot */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <BlogSummaryCard status="published" count={publishedCount} />
        <BlogSummaryCard status="draft" count={draftCount} />
        <BlogSummaryCard status="archived" count={archivedCount} />
      </div>

      {/* Reusable AdminDataTable with Built-in Search & Pagination Defaults */}
      <AdminDataTable
        caption="Articles and essays management table"
        columns={columns}
        data={tableResult?.items ?? []}
        getRowKey={(blog) => blog._id}
        isLoading={tableResult === undefined}
        emptyMessage="No blog entries match your current search or filter criteria."
        searchPlaceholder="Search blogs by title..."
        filters={filters}
        onResetFilters={handleResetFilters}
        totalItems={tableResult?.totalFiltered ?? 0}
        itemNoun="written blogs"
        onQueryChange={setTableQuery}
        className="mt-6"
      />
    </AdminContainer>
  )
}
