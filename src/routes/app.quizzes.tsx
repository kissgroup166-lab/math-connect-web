import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Check, RotateCcw, Trophy, X } from 'lucide-react'

import { PageHeader } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { topics, type TopicId } from '@/data/lessons'
import { PASS_MARK, questions } from '@/data/quizzes'
import { useProgress } from '@/lib/progress'
import { cn } from '@/lib/utils'

type QuizKey = TopicId | 'all'

export const Route = createFileRoute('/app/quizzes')({
  validateSearch: (s: Record<string, unknown>): { topic?: QuizKey } =>
    ['trig', 'exp', 'log', 'all'].includes(s.topic as string) ? { topic: s.topic as QuizKey } : {},
  head: () => ({ meta: [{ title: 'Quizzes · MathConnect' }] }),
  component: Quizzes,
})

const quizzes: { key: QuizKey; name: string }[] = [
  ...topics.map((t) => ({ key: t.id as QuizKey, name: t.name })),
  { key: 'all', name: 'Mixed review — all 30' },
]

function Quizzes() {
  const { topic } = Route.useSearch()
  const { progress } = useProgress()

  if (topic) return <QuizRunner key={topic} quizKey={topic} />

  return (
    <>
      <PageHeader title="Quizzes" description="Instant feedback with explanations. Retry as often as you like and your best score is saved." />
      <div className="grid gap-4 md:grid-cols-2">
        {quizzes.map((q) => {
          const count = q.key === 'all' ? questions.length : questions.filter((x) => x.topic === q.key).length
          const best = progress.quizBest[q.key]
          return (
            <div key={q.key} className="flex flex-col rounded-2xl border bg-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-bold">{q.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {count} questions · {progress.quizAttempts[q.key] ?? 0} attempts
                  </p>
                </div>
                {best !== undefined && (
                  <span className={cn('math rounded-full px-2.5 py-1 text-xs font-semibold', best >= PASS_MARK * 100 ? 'bg-success/15 text-success' : 'bg-muted')}>
                    Best {best}%
                  </span>
                )}
              </div>
              <Button asChild className="mt-6 self-start">
                <Link to="/app/quizzes" search={{ topic: q.key }}>
                  {best !== undefined ? 'Retry quiz' : 'Start quiz'}
                </Link>
              </Button>
            </div>
          )
        })}
      </div>
    </>
  )
}

function QuizRunner({ quizKey }: { quizKey: QuizKey }) {
  const set = quizKey === 'all' ? questions : questions.filter((q) => q.topic === quizKey)
  const name = quizzes.find((q) => q.key === quizKey)!.name
  const { progress, update } = useProgress()
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const q = set[i]
  const answered = picked !== null

  function choose(idx: number) {
    if (answered) return
    setPicked(idx)
    const right = idx === q.answer
    if (right) setScore((s) => s + 1)
    update((p) => ({ ...p, answered: { ...p.answered, [q.id]: p.answered[q.id] || right } }))
  }

  function next() {
    if (i + 1 < set.length) {
      setI(i + 1)
      setPicked(null)
      return
    }
    const pct = Math.round((score / set.length) * 100)
    update((p) => ({
      ...p,
      quizBest: { ...p.quizBest, [quizKey]: Math.max(pct, p.quizBest[quizKey] ?? 0) },
      quizAttempts: { ...p.quizAttempts, [quizKey]: (p.quizAttempts[quizKey] ?? 0) + 1 },
    }))
    setDone(true)
  }

  function retry() {
    setI(0)
    setPicked(null)
    setScore(0)
    setDone(false)
  }

  if (done) {
    const pct = Math.round((score / set.length) * 100)
    const passed = pct >= PASS_MARK * 100
    return (
      <div className="mx-auto max-w-lg rounded-2xl border bg-card p-8 text-center">
        <Trophy className={cn('mx-auto size-12', passed ? 'text-highlight' : 'text-muted-foreground')} />
        <h1 className="mt-4 font-display text-3xl font-bold">{pct}%</h1>
        <p className="mt-1 text-muted-foreground">
          {score} of {set.length} correct · {passed ? 'Passed!' : `${PASS_MARK * 100}% needed to pass`}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Best score: {Math.max(pct, progress.quizBest[quizKey] ?? 0)}%</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={retry}>
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
      <div className="mb-6 flex items-center justify-between text-sm">
        <Link to="/app/quizzes" className="text-muted-foreground hover:text-foreground">
          ← {name}
        </Link>
        <span className="math text-muted-foreground">
          {i + 1}/{set.length} · score {score}
        </span>
      </div>
      <Progress value={(i / set.length) * 100} className="mb-8 h-1.5 bg-muted" />
      <h1 className="math text-xl font-semibold">{q.prompt}</h1>
      <div className="mt-6 grid gap-3" role="radiogroup" aria-label="Answer choices">
        {q.choices.map((c, idx) => {
          const isRight = answered && idx === q.answer
          const isWrong = answered && idx === picked && idx !== q.answer
          return (
            <button
              key={idx}
              role="radio"
              aria-checked={picked === idx}
              disabled={answered}
              onClick={() => choose(idx)}
              className={cn(
                'math flex items-center justify-between rounded-xl border bg-card px-4 py-3 text-left transition-colors motion-reduce:transition-none',
                !answered && 'hover:border-primary hover:bg-secondary',
                isRight && 'border-success bg-success/10',
                isWrong && 'border-destructive bg-destructive/10',
              )}
            >
              {c}
              {isRight && <Check className="size-4 text-success" />}
              {isWrong && <X className="size-4 text-destructive" />}
            </button>
          )
        })}
      </div>
      {answered && (
        <div className="mt-6 rounded-xl bg-muted p-4" aria-live="polite">
          <p className={cn('font-semibold', picked === q.answer ? 'text-success' : 'text-destructive')}>
            {picked === q.answer ? 'Correct!' : 'Not quite.'}
          </p>
          <p className="mt-1 text-sm">{q.explanation}</p>
          <Button className="mt-4" onClick={next}>
            {i + 1 < set.length ? 'Next question' : 'See results'}
          </Button>
        </div>
      )}
    </div>
  )
}
