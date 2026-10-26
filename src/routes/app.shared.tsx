import { createFileRoute, Link } from '@tanstack/react-router'
import { Download, FileText, FolderOpen } from 'lucide-react'

import { PageHeader } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useContent, type TopicId } from '@/lib/content'
import { fileUrl } from '@/lib/submissions'
import { listApproved } from '@/lib/submissions.functions'

export const Route = createFileRoute('/app/shared')({
  head: () => ({ meta: [{ title: 'Shared Materials · MathConnect' }] }),
  validateSearch: (s: Record<string, unknown>): { topic?: TopicId } =>
    ['trig', 'exp', 'log'].includes(s.topic as string) ? { topic: s.topic as TopicId } : {},
  loader: () => listApproved({ data: {} }),
  component: Shared,
})

function Shared() {
  const approvedMaterials = Route.useLoaderData()
  const topic = Route.useSearch().topic ?? 'all'
  const navigate = Route.useNavigate()
  const setTopic = (t: TopicId | 'all') => navigate({ search: t === 'all' ? {} : { topic: t }, replace: true })
  const { lessons, topics } = useContent()
  const visible = lessons.filter((l) => topic === 'all' || l.topic === topic)

  return (
    <>
      <PageHeader
        title="Shared Materials"
        description="PDFs from students and teachers, organized by lesson. Every file here was reviewed and approved by an admin."
        action={
          <Button asChild variant="outline">
            <Link to="/app/materials">Share a PDF</Link>
          </Button>
        }
      />
      <Tabs value={topic} onValueChange={(v) => setTopic(v as TopicId | 'all')} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All topics</TabsTrigger>
          {topics.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              {t.short}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="space-y-4">
        {visible.map((l) => {
          const files = approvedMaterials.filter((m) => m.lessonId === l.id)
          return (
            <section key={l.id} className="rounded-2xl border bg-card p-5">
              <div className="flex items-center justify-between gap-4">
                <Link to="/app/learn/$lessonId" params={{ lessonId: l.id }} className="font-semibold hover:underline">
                  {l.title}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {files.length} file{files.length === 1 ? '' : 's'}
                </span>
              </div>
              {files.length === 0 ? (
                <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <FolderOpen className="size-4" /> No approved materials yet.
                </p>
              ) : (
                <ul className="mt-3 grid gap-3 md:grid-cols-2">
                  {files.map((f) => (
                    <li key={f.id} className="flex items-center gap-3 rounded-xl bg-muted p-3">
                      <FileText className="size-8 shrink-0 text-destructive" />
                      <div className="min-w-0 flex-1">
                        <a href={fileUrl(f.id)} target="_blank" rel="noreferrer" className="block truncate text-sm font-medium hover:underline">
                          {f.title}
                        </a>
                        <p className="text-xs text-muted-foreground">
                          {f.ownerName} · <span className="capitalize">{f.ownerRole}</span> · {(f.sizeKb / 1024).toFixed(1)} MB
                        </p>
                      </div>
                      <Button asChild variant="ghost" size="icon-sm">
                        <a href={fileUrl(f.id, true)} aria-label={`Download ${f.title}`}>
                          <Download />
                        </a>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>
    </>
  )
}
