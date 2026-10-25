import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, BookOpen, FolderOpen, Gamepad2, Trophy } from 'lucide-react'

import { PageHeader } from '@/components/app-shell'
import { SubmissionRow } from '@/components/submission-bits'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { lessons, topics } from '@/data/lessons'
import { questions } from '@/data/quizzes'
import { lessonPct, useProgress } from '@/lib/progress'
import { inReview } from '@/lib/submissions'
import { listMySubmissions } from '@/lib/submissions.functions'

export const Route = createFileRoute('/app/')({
  head: () => ({ meta: [{ title: 'Home · MathConnect' }] }),
  loader: () => listMySubmissions(),
  component: Home,
})

function StatCard({ icon: Icon, label, value, sub, pct }: { icon: typeof BookOpen; label: string; value: string; sub: string; pct?: number }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon className="size-4 text-chart-1" />
      </div>
      <p className="mt-3 font-display text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
      {pct !== undefined && <Progress value={pct} className="mt-4 h-1.5 bg-muted" />}
    </div>
  )
}

function Home() {
  const { viewer } = Route.useRouteContext()
  const mySubmissions = Route.useLoaderData()
  const { progress } = useProgress()
  const pctFor = (id: string) => lessonPct(progress, id)
  const done = lessons.filter((l) => pctFor(l.id) === 100).length
  const correct = Object.values(progress.answered).filter(Boolean).length
  const pendingUploads = mySubmissions.filter(inReview).length
  const gamesPlayed = Object.keys(progress.gameBest).length
  const next = lessons.find((l) => pctFor(l.id) < 100) ?? lessons[0]

  return (
    <>
      <PageHeader title={`Hi, ${viewer.name.split(' ')[0]}`} description="Here’s where you left off." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BookOpen} label="Lessons completed" value={`${done}/${lessons.length}`} sub="Across all three topics" pct={(done / lessons.length) * 100} />
        <StatCard icon={Trophy} label="Quiz questions mastered" value={`${correct}/${questions.length}`} sub="Answered correctly at least once" pct={(correct / questions.length) * 100} />
        <StatCard icon={FolderOpen} label="Uploads in review" value={String(pendingUploads)} sub={`${mySubmissions.length} submitted in total`} />
        <StatCard icon={Gamepad2} label="Games played" value={`${gamesPlayed}/5`} sub="Best scores are saved" pct={(gamesPlayed / 5) * 100} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="graph-paper rounded-2xl border bg-card p-6">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Continue learning</p>
          <h2 className="mt-2 font-display text-2xl font-bold">{next.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{next.summary}</p>
          <p className="math mt-4 inline-block rounded-lg bg-card px-3 py-2 text-sm shadow-sm">{next.formulas[0].expr}</p>
          <div className="mt-6 flex items-center gap-4">
            <Button asChild>
              <Link to="/app/learn/$lessonId" params={{ lessonId: next.id }}>
                Resume lesson <ArrowRight />
              </Link>
            </Button>
            <span className="text-sm text-muted-foreground">{pctFor(next.id)}% complete</span>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-6">
          <h2 className="font-semibold">Topic progress</h2>
          <ul className="mt-4 space-y-5">
            {topics.map((t) => {
              const ls = lessons.filter((l) => l.topic === t.id)
              const pct = Math.round(ls.reduce((a, l) => a + pctFor(l.id), 0) / ls.length)
              return (
                <li key={t.id}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="font-medium">{t.name}</span>
                    <span className="math text-muted-foreground">{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-2 bg-muted" />
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      <section className="mt-8 rounded-2xl border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Your recent uploads</h2>
          <Link to="/app/materials" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="divide-y">
          {mySubmissions.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">You haven’t uploaded anything yet.</p>
          ) : (
            mySubmissions.slice(0, 3).map((s) => <SubmissionRow key={s.id} s={s} />)
          )}
        </div>
      </section>
    </>
  )
}
