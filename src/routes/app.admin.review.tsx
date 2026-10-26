import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { AlertTriangle, Check, ExternalLink, Eye, X } from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/app-shell'
import { FileLink, ScoreMeter, StatusBadge } from '@/components/submission-bits'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useContent } from '@/lib/content'
import { fileUrl, inReview, type Submission } from '@/lib/submissions'
import { listAllSubmissions, reviewSubmission } from '@/lib/submissions.functions'

export const Route = createFileRoute('/app/admin/review')({
  head: () => ({ meta: [{ title: 'Review uploads · MathConnect' }] }),
  loader: () => listAllSubmissions(),
  component: Review,
})

const queues = {
  pending: inReview,
  approved: (s: Submission) => s.status === 'approved',
  rejected: (s: Submission) => s.status === 'rejected',
} as const

function ReviewDialog({
  s,
  busy,
  onClose,
  onDecide,
}: {
  s: Submission | null
  busy: boolean
  onClose: () => void
  onDecide: (id: string, approve: boolean, feedback: string) => void
}) {
  const [feedback, setFeedback] = useState(s?.adminFeedback ?? '')
  const { getLesson, getTopic } = useContent()
  const lesson = s ? getLesson(s.lessonId) : undefined
  return (
    <Dialog open={!!s} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        {s && (
          <>
            <DialogHeader>
              <DialogTitle>{s.title}</DialogTitle>
              <DialogDescription>
                {s.ownerName} ({s.ownerRole}) · {lesson ? `${getTopic(lesson.topic).name} → ${lesson.title}` : 'Hidden lesson'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-[12rem_1fr]">
              <div className="flex flex-col gap-2">
                <iframe src={fileUrl(s.id)} title={`Preview of ${s.fileName}`} className="aspect-[3/4] w-full rounded-xl border bg-muted" />
                <a
                  href={fileUrl(s.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Open full size <ExternalLink className="size-3" />
                </a>
                <span className="text-xs break-all text-muted-foreground">
                  {s.fileName} · {(s.sizeKb / 1024).toFixed(1)} MB
                </span>
              </div>
              <div className="space-y-3 text-sm">
                <ScoreMeter score={s.score} band={s.band} />
                <p>{s.explanation}</p>
                {s.flags.length > 0 && (
                  <p className="flex items-center gap-2 rounded-lg bg-warning/20 px-3 py-2 font-medium">
                    <AlertTriangle className="size-4" /> {s.flags.join(', ')} — check this file by hand
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  The score is an estimate. Approving publishes the file to Shared Materials under this lesson.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="feedback">Feedback to uploader</Label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Optional for approvals, recommended for rejections"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" disabled={busy} onClick={() => onDecide(s.id, false, feedback)}>
                <X /> Reject
              </Button>
              <Button disabled={busy} onClick={() => onDecide(s.id, true, feedback)}>
                <Check /> Approve & publish
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function SubmissionsPanel({ items }: { items: Submission[] }) {
  const router = useRouter()
  const [queue, setQueue] = useState<keyof typeof queues>('pending')
  const [reviewing, setReviewing] = useState<Submission | null>(null)
  const [busy, setBusy] = useState(false)
  const { getLesson } = useContent()
  const shown = items.filter(queues[queue])

  async function decide(id: string, approve: boolean, feedback: string) {
    setBusy(true)
    try {
      await reviewSubmission({ data: { id, approve, feedback } })
      await router.invalidate()
      setReviewing(null)
      toast.success(approve ? 'Approved and published' : 'Submission rejected')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save the decision.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="mb-4 grid grid-cols-3 gap-3">
        {(Object.keys(queues) as (keyof typeof queues)[]).map((k) => (
          <button
            key={k}
            onClick={() => setQueue(k)}
            aria-pressed={queue === k}
            className={`rounded-2xl border p-4 text-left transition-colors motion-reduce:transition-none ${queue === k ? 'border-primary bg-secondary' : 'bg-card hover:bg-muted'}`}
          >
            <p className="text-sm capitalize text-muted-foreground">{k}</p>
            <p className="font-display text-3xl font-bold">{items.filter(queues[k]).length}</p>
          </button>
        ))}
      </div>
      <div className="rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File</TableHead>
              <TableHead>Lesson</TableHead>
              <TableHead>Relevance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Nothing in this queue.
                </TableCell>
              </TableRow>
            )}
            {shown.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <FileLink s={s} className="font-medium" />
                  <p className="text-xs text-muted-foreground">
                    {s.ownerName} · {s.ownerRole}
                  </p>
                </TableCell>
                <TableCell className="text-sm">{getLesson(s.lessonId)?.title ?? 'Hidden lesson'}</TableCell>
                <TableCell>
                  <ScoreMeter score={s.score} band={s.band} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={s.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant={queue === 'pending' ? 'default' : 'outline'} onClick={() => setReviewing(s)}>
                    <Eye /> {queue === 'pending' ? 'Review' : 'Preview'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ReviewDialog key={reviewing?.id} s={reviewing} busy={busy} onClose={() => setReviewing(null)} onDecide={decide} />
    </>
  )
}

function Review() {
  const submissions = Route.useLoaderData()
  return (
    <>
      <PageHeader title="Review uploads" description="Check each PDF against its lesson, then approve it for Shared Materials or reject it with feedback." />
      <SubmissionsPanel items={submissions} />
    </>
  )
}
