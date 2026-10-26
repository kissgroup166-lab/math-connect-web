import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Check, RotateCcw, Trophy, X } from 'lucide-react'

import { PageHeader } from '@/components/app-shell'
import { shuffle } from '@/components/games/shared'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { PASS_MARK, quizKeys, useContent, type QuizKey, type QuizQuestion, type QuizSettings } from '@/lib/content'
import { useProgress, type QuizRun } from '@/lib/progress'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/app/quizzes')({
  validateSearch: (s: Record<string, unknown>): { topic?: QuizKey } =>
    (quizKeys as readonly string[]).includes(s.topic as string) ? { topic: s.topic as QuizKey } : {},
  head: () => ({ meta: [{ title: 'Quizzes · MathConnect' }] }),
  component: Quizzes,
})

// A saved run still fits if its questions exist; questions the admin removed are dropped.
function usableRun(run: QuizRun | undefined, set: QuizQuestion[]): QuizRun | null {
  if (!run) return null
  const ids = new Set(set.map((q) => q.id))
  const order = run.order.filter((id) => ids.has(id))
  if (order.length === 0 || run.i >= order.length) return null
  return { ...run, order, i: Math.min(run.i, order.length - 1) }
}

function newRun(set: QuizQuestion[], settings: QuizSettings): QuizRun {
  const order = set.map((q) => q.id)
  return {
    order: settings.shuffleQuestions ? shuffle(order) : order,
    choiceOrders: settings.shuffleChoices ? Object.fromEntries(set.map((q) => [q.id, shuffle(q.choices.map((_, k) => k))])) : {},
    i: 0,
    score: 0,
    picked: null,
  }
}

function Quizzes() {
  const { topic } = Route.useSearch()
  const { progress, loaded } = useProgress()
  const { topics, questions, quizSettings } = useContent()
  const quizzes: { key: QuizKey; name: string }[] = [
    ...topics.map((t) => ({ key: t.id as QuizKey, name: t.name })),
    { key: 'all', name: `Mixed review — all ${questions.length}` },
  ]
  const setFor = (key: QuizKey) => (key === 'all' ? questions : questions.filter((q) => q.topic === key))

  if (topic) {
    const set = setFor(topic)
    if (set.length === 0)
      return (
        <div className="mx-auto max-w-md rounded-2xl border bg-card p-8 text-center" role="status">
          <p className="text-muted-foreground">This quiz has no questions yet.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/app/quizzes">All quizzes</Link>
          </Button>
        </div>
      )
    // Wait for saved progress so an unfinished quiz resumes instead of restarting.
    if (!loaded)
      return (
        <div className="mx-auto max-w-2xl space-y-4" aria-busy="true" aria-label="Loading quiz">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-1.5 w-full" />
          <Skeleton className="h-7 w-3/4" />
          {[0, 1, 2, 3].map((k) => (
            <Skeleton key={k} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      )
    return (
      <QuizRunner
        key={topic}
        quizKey={topic}
        set={set}
        settings={quizSettings[topic]}
        name={quizzes.find((q) => q.key === topic)!.name}
        saved={usableRun(progress.quizRuns[topic], set)}
      />
    )
  }

  return (
    <>
      <PageHeader
        title="Quizzes"
        description="Instant feedback with explanations. Your scores are saved to your account, and an unfinished quiz picks up where you left off."
      />
      <div className="stagger grid gap-4 md:grid-cols-2">
        {quizzes.map((q) => {
          const set = setFor(q.key)
          const best = progress.quizBest[q.key]
          const run = usableRun(progress.quizRuns[q.key], set)
          return (
            <div key={q.key} className="flex flex-col rounded-2xl border bg-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-bold">{q.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {set.length} questions · {progress.quizAttempts[q.key] ?? 0} attempts
                  </p>
                </div>
                {best !== undefined && (
                  <span
                    className={cn('math rounded-full px-2.5 py-1 text-xs font-semibold', best >= PASS_MARK * 100 ? 'bg-success/15 text-success' : 'bg-muted')}
                  >
                    Best {best}%
                  </span>
                )}
              </div>
              {run && (
                <p className="mt-3 text-sm font-medium text-primary">
                  In progress · question {run.i + 1} of {run.order.length}
                </p>
              )}
              {set.length > 0 ? (
                <Button asChild className="mt-6 self-start">
                  <Link to="/app/quizzes" search={{ topic: q.key }}>
                    {run ? 'Resume quiz' : best !== undefined ? 'Retry quiz' : 'Start quiz'}
                  </Link>
                </Button>
              ) : (
                <p className="mt-6 text-sm text-muted-foreground">No questions yet.</p>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

function QuizRunner({
  quizKey,
  set,
  name,
  settings,
  saved,
}: {
  quizKey: QuizKey
  set: QuizQuestion[]
  name: string
  settings: QuizSettings
  saved: QuizRun | null
}) {
  const { progress, update } = useProgress()
  const [run, setRun] = useState<QuizRun>(() => saved ?? newRun(set, settings))
  const [done, setDone] = useState<{ score: number; total: number } | null>(null)
  const [resumed] = useState(() => !!saved && (saved.i > 0 || saved.picked !== null))

  const byId = new Map(set.map((q) => [q.id, q]))
  const q = byId.get(run.order[run.i])!
  const total = run.order.length
  // Display order of choices; falls back to the original order if the admin changed the choices.
  const stored = run.choiceOrders[q.id]
  const order = stored && stored.length === q.choices.length ? stored : q.choices.map((_, k) => k)
  const answered = run.picked !== null

  // Every step is saved, so leaving mid-quiz keeps the place and the score.
  function save(next: QuizRun) {
    setRun(next)
    update((p) => ({ ...p, quizRuns: { ...p.quizRuns, [quizKey]: next } }))
  }

  function choose(original: number) {
    if (answered) return
    const right = original === q.answer
    const next = {
      ...run,
      picked: original,
      score: run.score + (right ? 1 : 0),
    }
    setRun(next)
    update((p) => ({
      ...p,
      answered: { ...p.answered, [q.id]: p.answered[q.id] || right },
      quizRuns: { ...p.quizRuns, [quizKey]: next },
    }))
  }

  function next() {
    if (run.i + 1 < total) return save({ ...run, i: run.i + 1, picked: null })
    const pct = Math.round((run.score / total) * 100)
    update((p) => {
      const quizRuns = { ...p.quizRuns }
      delete quizRuns[quizKey]
      return {
        ...p,
        quizRuns,
        quizBest: {
          ...p.quizBest,
          [quizKey]: Math.max(pct, p.quizBest[quizKey] ?? 0),
        },
        quizAttempts: {
          ...p.quizAttempts,
          [quizKey]: (p.quizAttempts[quizKey] ?? 0) + 1,
        },
      }
    })
    setDone({ score: run.score, total })
  }

  function startOver() {
    setDone(null)
    save(newRun(set, settings))
  }

  if (done) {
    const pct = Math.round((done.score / done.total) * 100)
    const passed = pct >= PASS_MARK * 100
    return (
      <div className="mx-auto max-w-lg animate-rise rounded-2xl border bg-card p-8 text-center">
        <Trophy className={cn('mx-auto size-12', passed ? 'animate-float text-highlight' : 'text-muted-foreground')} />
        <h1 className="mt-4 animate-pop font-display text-3xl font-bold [animation-delay:150ms]">{pct}%</h1>
        <p className="mt-1 text-muted-foreground">
          {done.score} of {done.total} correct · {passed ? 'Passed!' : `${PASS_MARK * 100}% needed to pass`}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Best score: {Math.max(pct, progress.quizBest[quizKey] ?? 0)}%</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={startOver}>
            <RotateCcw /> Retry
          </Button>
          <Button variant="outline" asChild>
            <Link to="/app/quizzes">All quizzes</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2 text-sm">
        <Link to="/app/quizzes" className="text-muted-foreground hover:text-foreground">
          ← {name}
        </Link>
        <span className="flex items-center gap-3">
          <span className="math text-muted-foreground">
            {run.i + 1}/{total} · score {run.score}
          </span>
          {(run.i > 0 || answered) && (
            <Button variant="ghost" size="sm" onClick={startOver}>
              <RotateCcw /> Start over
            </Button>
          )}
        </span>
      </div>
      {resumed && run.i === saved?.i && (
        <p className="mb-4 rounded-lg bg-secondary px-3 py-2 text-sm" role="status">
          Welcome back — you’re picking up at question {run.i + 1}.
        </p>
      )}
      <Progress value={(run.i / total) * 100} className="mb-8 h-1.5 bg-muted" />
      {/* Keyed on the question so each new question slides in. */}
      <div key={q.id} className="animate-rise">
        <h1 className="math text-xl font-semibold">{q.prompt}</h1>
        <div className="mt-6 grid gap-3" role="radiogroup" aria-label="Answer choices">
          {order.map((original) => {
            const isRight = answered && original === q.answer
            const isWrong = answered && original === run.picked && original !== q.answer
            return (
              <button
                key={original}
                role="radio"
                aria-checked={run.picked === original}
                disabled={answered}
                onClick={() => choose(original)}
                className={cn(
                  'math flex items-center justify-between rounded-xl border bg-card px-4 py-3 text-left transition-colors motion-reduce:transition-none',
                  !answered && 'hover:border-primary hover:bg-secondary',
                  isRight && 'animate-pop border-success bg-success/10',
                  isWrong && 'animate-shake border-destructive bg-destructive/10',
                )}
              >
                {q.choices[original]}
                {isRight && <Check className="size-4 text-success animate-in zoom-in-50 motion-reduce:animate-none" />}
                {isWrong && <X className="size-4 text-destructive animate-in zoom-in-50 motion-reduce:animate-none" />}
              </button>
            )
          })}
        </div>
        {answered && (
          <div className="mt-6 animate-rise rounded-xl bg-muted p-4" aria-live="polite">
            <p className={cn('font-semibold', run.picked === q.answer ? 'text-success' : 'text-destructive')}>
              {run.picked === q.answer ? 'Correct!' : 'Not quite.'}
            </p>
            <p className="mt-1 text-sm">{q.explanation}</p>
            <Button className="mt-4" onClick={next}>
              {run.i + 1 < total ? 'Next question' : 'See results'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
