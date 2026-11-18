import { Eye, FileEdit, Plus } from 'lucide-react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useNavigate } from '@/navigation/RouterContext'
import { PATHS } from '@/navigation/paths'

export function AdminBlogsPage() {
  const navigate = useNavigate()
  const blogs = useQuery(api.blogs.listAllForAdmin, {})

  const publishedCount =
    blogs?.filter((b) => b.status === 'published').length ?? 0
  const draftCount = blogs?.filter((b) => b.status === 'draft').length ?? 0

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-normal tracking-tight text-foreground">
            Articles &amp; Essays
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {publishedCount} published dispatches &middot; {draftCount} drafts in
            Convex
          </p>
        </div>

        <Button
          type="button"
          onClick={() => navigate(PATHS.ADMIN_CREATE_BLOG)}
          className="self-start px-4 py-2 text-xs font-medium shadow-2xs sm:self-auto"
        >
          <Plus aria-hidden="true" className="size-3.5" />
          <span>Create New Blog</span>
        </Button>
      </div>

      <Card className="mt-6 overflow-hidden rounded-xl border-border bg-white p-0 py-0 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">Registered blog entries</caption>
            <thead className="border-b border-border bg-card/70 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              <tr>
                <th scope="col" className="px-5 py-3.5">
                  Date
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Essay Title
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Category
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Subscription
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Status
                </th>
                <th scope="col" className="px-5 py-3.5 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {blogs?.map((blog) => (
                <tr key={blog._id} className="hover:bg-card/40">
                  <td className="whitespace-nowrap px-5 py-3.5 text-muted-foreground">
                    {blog.date}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-foreground">
                    {blog.title}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex rounded-md border border-border bg-card px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {blog.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
                        blog.isPaid
                          ? 'border-amber-200 bg-amber-50 text-amber-800'
                          : 'border-border bg-card text-muted-foreground'
                      }`}
                    >
                      {blog.priceLabel}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        blog.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`size-1.5 rounded-full ${
                          blog.status === 'published'
                            ? 'bg-emerald-600'
                            : 'bg-amber-600'
                        }`}
                      />
                      <span>
                        {blog.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() =>
                          navigate(PATHS.ADMIN_CREATE_BLOG, {
                            search: `?editId=${blog._id}`,
                          })
                        }
                        aria-label={`Edit ${blog.title}`}
                      >
                        <FileEdit aria-hidden="true" className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() =>
                          navigate(PATHS.BLOG_DETAILS, {
                            search: `?id=${blog._id}&from=create`,
                          })
                        }
                        aria-label={`Preview ${blog.title}`}
                      >
                        <Eye aria-hidden="true" className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
