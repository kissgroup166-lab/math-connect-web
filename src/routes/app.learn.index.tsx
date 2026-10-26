import { createFileRoute, Link } from '@tanstack/react-router'
import { CheckCircle2, Clock } from 'lucide-react'

import { PageHeader } from '@/components/app-shell'
import { Progress } from '@/components/ui/progress'
import { useContent } from '@/lib/content'
import { lessonPct, useProgress } from '@/lib/progress'

export const Route = createFileRoute('/app/learn/')({
  head: () => ({ meta: [{ title: 'Learn · MathConnect' }] }),
  component: Learn,
})

function Learn() {
  const { progress } = useProgress()
  const { lessons, topics, questions } = useContent()
  return (
    <>
      <PageHeader
        title="Learn"
        description={`${lessons.length} lessons across three topics. Each one has formulas, an explanation, worked examples, and practice.`}
      />
      <div className="space-y-10">
        {topics.map((t) => (
          <section key={t.id} aria-labelledby={`topic-${t.id}`}>
            <h2 id={`topic-${t.id}`} className="font-display text-xl font-bold">
              {t.name}
            </h2>
            <p className="text-sm text-muted-foreground">{t.blurb}</p>
            <div className="stagger mt-4 grid gap-4 md:grid-cols-3">
              {lessons
                .filter((l) => l.topic === t.id)
                .map((l) => {
                  const pct = lessonPct(progress, questions, l.id)
                  return (
                    <Link
                      key={l.id}
                      to="/app/learn/$lessonId"
                      params={{ lessonId: l.id }}
                      className="lift flex flex-col rounded-2xl border bg-card p-5"
                    >
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="rounded-full bg-secondary px-2 py-0.5 font-medium text-secondary-foreground">{l.level}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" /> {l.minutes} min
                        </span>
                      </div>
                      <h3 className="mt-3 font-semibold">{l.title}</h3>
                      <p className="mt-1 flex-1 text-sm text-muted-foreground">{l.summary}</p>
                      <p className="math mt-4 truncate rounded-md bg-muted px-2 py-1.5 text-xs">{l.formulas[0].expr}</p>
                      <div className="mt-4 flex items-center gap-2">
                        <Progress value={pct} className="h-1.5 bg-muted" />
                        {pct === 100 ? <CheckCircle2 className="size-4 shrink-0 text-success" /> : <span className="math text-xs text-muted-foreground">{pct}%</span>}
                      </div>
                    </Link>
                  )
                })}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
