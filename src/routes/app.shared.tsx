import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Download, FileText, FolderOpen } from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { approvedMaterials } from '@/data/fixtures'
import { lessons, topics, type TopicId } from '@/data/lessons'

export const Route = createFileRoute('/app/shared')({
  head: () => ({ meta: [{ title: 'Shared Materials · MathConnect' }] }),
  component: Shared,
})

function Shared() {
  const [topic, setTopic] = useState<TopicId | 'all'>('all')
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
                        <p className="truncate text-sm font-medium">{f.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {f.ownerName} · <span className="capitalize">{f.ownerRole}</span> · {(f.sizeKb / 1024).toFixed(1)} MB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Download ${f.title}`}
                        onClick={() => toast('Downloads open once file storage is connected')}
                      >
                        <Download />
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
