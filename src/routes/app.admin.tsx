import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { AlertTriangle, BookOpen, Check, Eye, FileText, Gamepad2, ShieldCheck, Trophy, X } from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/app-shell'
import { games } from '@/components/games'
import { ScoreMeter, StatusBadge } from '@/components/submission-bits'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { submissions as seedSubmissions, users as seedUsers, type AppUser, type Submission } from '@/data/fixtures'
import { getLesson, getTopic, lessons } from '@/data/lessons'
import { questions } from '@/data/quizzes'

export const Route = createFileRoute('/app/admin')({
  head: () => ({ meta: [{ title: 'Admin · MathConnect' }] }),
  component: Admin,
})

const queues = {
  pending: (s: Submission) => ['queued', 'pending', 'review', 'flagged'].includes(s.status),
  approved: (s: Submission) => s.status === 'approved',
  rejected: (s: Submission) => s.status === 'rejected',
} as const

function ReviewDialog({ s, onClose, onDecide }: { s: Submission | null; onClose: () => void; onDecide: (id: string, approve: boolean, feedback: string) => void }) {
  const [feedback, setFeedback] = useState('')
  const lesson = s ? getLesson(s.lessonId) : undefined
  return (
    <Dialog open={!!s} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        {s && lesson && (
          <>
            <DialogHeader>
              <DialogTitle>{s.title}</DialogTitle>
              <DialogDescription>
                {s.ownerName} ({s.ownerRole}) · {getTopic(lesson.topic).name} → {lesson.title}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-[12rem_1fr]">
              <div className="graph-paper flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-xl border text-center">
                <FileText className="size-10 text-destructive" />
                <span className="px-3 text-xs break-all text-muted-foreground">{s.fileName}</span>
                <span className="text-xs text-muted-foreground">{(s.sizeKb / 1024).toFixed(1)} MB</span>
              </div>
              <div className="space-y-3 text-sm">
                <ScoreMeter score={s.score} band={s.band} />
                <p>{s.explanation}</p>
                {s.flags.length > 0 && (
                  <p className="flex items-center gap-2 rounded-lg bg-warning/20 px-3 py-2 font-medium">
                    <AlertTriangle className="size-4" /> {s.flags.join(', ')} — check this file by hand
                  </p>
                )}
                <p className="text-xs text-muted-foreground">The score is an estimate. Approving publishes the file to Shared Materials under this lesson.</p>
                <div className="space-y-2">
                  <Label htmlFor="feedback">Feedback to uploader</Label>
                  <Textarea id="feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Optional for approvals, recommended for rejections" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onDecide(s.id, false, feedback)}>
                <X /> Reject
              </Button>
              <Button onClick={() => onDecide(s.id, true, feedback)}>
                <Check /> Approve & publish
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function SubmissionsPanel() {
  const [items, setItems] = useState(seedSubmissions)
  const [queue, setQueue] = useState<keyof typeof queues>('pending')
  const [reviewing, setReviewing] = useState<Submission | null>(null)
  const shown = items.filter(queues[queue])

  function decide(id: string, approve: boolean, feedback: string) {
    setItems((prev) => prev.map((s) => (s.id === id ? { ...s, status: approve ? 'approved' : 'rejected', adminFeedback: feedback || undefined } : s)))
    setReviewing(null)
    toast.success(approve ? 'Approved and published' : 'Submission rejected')
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
                  <p className="font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.ownerName} · {s.ownerRole}
                  </p>
                </TableCell>
                <TableCell className="text-sm">{getLesson(s.lessonId)?.title}</TableCell>
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
      <ReviewDialog key={reviewing?.id} s={reviewing} onClose={() => setReviewing(null)} onDecide={decide} />
    </>
  )
}

function UsersPanel() {
  const [list, setList] = useState<AppUser[]>(seedUsers)
  const patch = (id: string, p: Partial<AppUser>) => setList((prev) => prev.map((u) => (u.id === id ? { ...u, ...p } : u)))

  return (
    <div className="rounded-2xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Verified teacher</TableHead>
            <TableHead className="text-right">Uploads</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((u) => (
            <TableRow key={u.id}>
              <TableCell>
                <p className="font-medium">{u.name}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </TableCell>
              <TableCell>
                {u.role === 'admin' ? (
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    <ShieldCheck className="size-4" /> Admin (owner)
                  </span>
                ) : (
                  <Select value={u.role} onValueChange={(v) => patch(u.id, { role: v as AppUser['role'], canPublish: false })}>
                    <SelectTrigger size="sm" className="w-32" aria-label={`Role for ${u.name}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </TableCell>
              <TableCell>
                {u.role === 'teacher' ? (
                  <Switch checked={!!u.canPublish} onCheckedChange={(c) => patch(u.id, { canPublish: c })} aria-label={`Teacher permissions for ${u.name}`} />
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="math text-right">{u.uploads}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="border-t p-4 text-xs text-muted-foreground">
        The admin role can’t be assigned from here and belongs only to the site owner. Verified teachers can add quiz questions and lesson notes, but their PDFs still go through admin approval.
      </p>
    </div>
  )
}

function ContentPanel() {
  const cards = [
    { icon: BookOpen, label: 'Lessons', value: lessons.length, to: '/app/learn' as const },
    { icon: Trophy, label: 'Quiz questions', value: questions.length, to: '/app/quizzes' as const },
    { icon: Gamepad2, label: 'Games', value: games.length, to: '/app/games' as const },
  ]
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((c) => (
        <Link key={c.label} to={c.to} className="rounded-2xl border bg-card p-6 hover:shadow-md">
          <c.icon className="size-5 text-chart-1" />
          <p className="mt-4 font-display text-3xl font-bold">{c.value}</p>
          <p className="text-sm text-muted-foreground">{c.label}</p>
        </Link>
      ))}
    </div>
  )
}

function Admin() {
  return (
    <>
      <PageHeader title="Admin" description="Review PDF submissions, manage users and teacher permissions, and oversee course content." />
      <Tabs defaultValue="submissions">
        <TabsList className="mb-6">
          <TabsTrigger value="submissions">PDF submissions</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>
        <TabsContent value="submissions">
          <SubmissionsPanel />
        </TabsContent>
        <TabsContent value="users">
          <UsersPanel />
        </TabsContent>
        <TabsContent value="content">
          <ContentPanel />
        </TabsContent>
      </Tabs>
    </>
  )
}
