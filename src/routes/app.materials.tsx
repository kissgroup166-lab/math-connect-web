import { useRef, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { ChevronDown, ExternalLink, FolderOpen, Info, Loader2, UploadCloud } from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/app-shell'
import { SubmissionRow } from '@/components/submission-bits'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useContent } from '@/lib/content'
import { fileUrl, inReview, MAX_UPLOAD_BYTES, MAX_UPLOAD_MB, type Submission } from '@/lib/submissions'
import { listMySubmissions, uploadSubmission } from '@/lib/submissions.functions'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/app/materials')({
  head: () => ({ meta: [{ title: 'My Materials · MathConnect' }] }),
  loader: () => listMySubmissions(),
  component: MyMaterials,
})

const filters = {
  all: () => true,
  review: inReview,
  approved: (s: Submission) => s.status === 'approved',
  rejected: (s: Submission) => s.status === 'rejected',
} as const

function validate(file: File): string | null {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) return 'Only PDF files can be uploaded.'
  if (file.size > MAX_UPLOAD_BYTES) return `This file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${MAX_UPLOAD_MB} MB.`
  if (file.size === 0) return 'This file is empty.'
  return null
}

function UploadCard({ onUploaded }: { onUploaded: () => Promise<void> }) {
  const { lessons, topics } = useContent()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [lessonId, setLessonId] = useState('')
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)

  function take(f: File | undefined) {
    if (!f) return
    const err = validate(f)
    setError(err)
    setFile(err ? null : f)
    if (!err && !title) setTitle(f.name.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' '))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !lessonId || busy) return
    const form = new FormData()
    form.set('file', file)
    form.set('lessonId', lessonId)
    form.set('title', title.trim())
    setBusy(true)
    try {
      const res = await uploadSubmission({ data: form })
      await onUploaded()
      setFile(null)
      setTitle('')
      setLessonId('')
      if (inputRef.current) inputRef.current.value = ''
      toast.success('PDF submitted', {
        description:
          res.score === null
            ? 'We couldn’t read its text, so the admin will check it by hand.'
            : `Relevance ${res.score}%. It stays private until an admin approves it.`,
      })
    } catch (err) {
      toast.error('Upload failed', {
        description: err instanceof Error ? err.message : 'Try again.',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border bg-card p-6">
      <h2 className="font-semibold">Upload a PDF</h2>
      <p className="text-sm text-muted-foreground">
        Share notes or worksheets for a lesson. They stay private until an admin reviews them.
      </p>

      <div
        role="button"
        tabIndex={0}
        aria-label="Choose a PDF to upload"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          take(e.dataTransfer.files[0])
        }}
        className={cn(
          'mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors motion-reduce:transition-none',
          dragging ? 'border-primary bg-secondary' : 'border-border bg-muted/50 hover:border-primary/60',
          error && 'border-destructive/60',
        )}
      >
        <span className="grid size-16 place-items-center rounded-2xl bg-accent text-accent-foreground">
          <FolderOpen className="size-8" />
        </span>
        {file ? (
          <>
            <p className="mt-4 font-semibold">{file.name}</p>
            <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB · click to choose a different file</p>
          </>
        ) : (
          <>
            <p className="mt-4 font-semibold">
              Drop your PDF here, or <span className="text-primary underline">browse</span>
            </p>
            <p className="text-sm text-muted-foreground">PDF only · up to {MAX_UPLOAD_MB} MB</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => take(e.target.files?.[0])}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="lesson">Lesson</Label>
          <Select value={lessonId} onValueChange={setLessonId}>
            <SelectTrigger id="lesson" className="w-full">
              <SelectValue placeholder="Choose the lesson this PDF covers" />
            </SelectTrigger>
            <SelectContent>
              {topics.map((t) => (
                <SelectGroup key={t.id}>
                  <SelectLabel>{t.name}</SelectLabel>
                  {lessons
                    .filter((l) => l.topic === t.id)
                    .map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.title}
                      </SelectItem>
                    ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Double-angle cheat sheet" />
        </div>
      </div>
      <Button type="submit" className="mt-5" disabled={!file || !lessonId || busy}>
        {busy ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <UploadCloud />}
        {busy ? 'Checking relevance…' : 'Submit for review'}
      </Button>
    </form>
  )
}

function ScoreGuide() {
  const rows = [
    {
      range: '80–100%',
      label: 'Relevant',
      detail: 'Goes to the admin for approval.',
      tone: 'bg-success',
    },
    {
      range: '50–79%',
      label: 'Needs review',
      detail: 'An admin checks it by hand.',
      tone: 'bg-chart-2',
    },
    {
      range: '0–49%',
      label: 'Likely unrelated',
      detail: 'Recommended for rejection.',
      tone: 'bg-destructive',
    },
  ]
  return (
    <aside className="rounded-2xl border bg-card p-6">
      <h2 className="flex items-center gap-2 font-semibold">
        <Info className="size-4 text-chart-1" /> How relevance checks work
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        We read the text in your PDF and compare its formulas and keywords with the lesson you chose.
      </p>
      <ul className="mt-4 space-y-3">
        {rows.map((r) => (
          <li key={r.range} className="flex gap-3 text-sm">
            <span className={cn('mt-1.5 size-2.5 shrink-0 rounded-full', r.tone)} />
            <span>
              <span className="math font-semibold">{r.range}</span> · {r.label}
              <span className="block text-muted-foreground">{r.detail}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
        Scores are estimates. Scanned, encrypted, or unreadable files are flagged for manual review. Nothing is published from the score
        alone.
      </p>
    </aside>
  )
}

function MyMaterials() {
  const items = Route.useLoaderData()
  const router = useRouter()
  const [filter, setFilter] = useState<keyof typeof filters>('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const shown = items.filter(filters[filter])

  return (
    <>
      <PageHeader title="My Materials" description="Upload PDFs for a lesson and track each one from review to approval." />
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <UploadCard onUploaded={() => router.invalidate()} />
        <ScoreGuide />
      </div>

      <section className="mt-8 rounded-2xl border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">My submissions</h2>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as keyof typeof filters)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="review">In review</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {shown.length === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-2xl border-2 border-dashed py-12 text-center">
            <FolderOpen className="size-10 text-muted-foreground" />
            <p className="mt-3 font-semibold">No materials here yet</p>
            <p className="text-sm text-muted-foreground">
              {filter === 'all' ? 'Your uploaded PDFs will appear here.' : 'Nothing matches this filter.'}
            </p>
          </div>
        ) : (
          <ul className="mt-2 divide-y">
            {shown.map((s) => (
              <li key={s.id}>
                <SubmissionRow
                  s={s}
                  action={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Show details"
                      aria-expanded={openId === s.id}
                      onClick={() => setOpenId(openId === s.id ? null : s.id)}
                    >
                      <ChevronDown className={cn('transition-transform', openId === s.id && 'rotate-180')} />
                    </Button>
                  }
                />
                {openId === s.id && (
                  <div className="mb-4 ml-14 space-y-2 rounded-xl bg-muted p-4 text-sm">
                    <p>
                      <span className="font-semibold">Relevance check: </span>
                      {s.explanation}
                    </p>
                    {s.flags.length > 0 && <p className="text-muted-foreground">Flags: {s.flags.join(', ')}</p>}
                    {s.adminFeedback && (
                      <p>
                        <span className="font-semibold">Admin feedback: </span>
                        {s.adminFeedback}
                      </p>
                    )}
                    <p className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      Submitted {new Date(s.uploadedAt).toLocaleString()}
                      <a
                        href={fileUrl(s.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                      >
                        Open PDF <ExternalLink className="size-3" />
                      </a>
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
