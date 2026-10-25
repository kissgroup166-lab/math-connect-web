import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { lessons } from '@/data/lessons'
import { cn } from '@/lib/utils'
import { GameOver, shuffle, type GameProps } from './shared'

// Worked examples with at least three steps become puzzles: put the steps in order.
const puzzles = lessons.flatMap((l) =>
  l.examples.filter((e) => e.steps.length >= 3).map((e) => ({ problem: e.problem, steps: [...e.steps, e.answer] })),
)
const ROUND = 4

export function EquationPuzzle({ onFinish, best }: GameProps) {
  const [seed, setSeed] = useState(0)
  const set = useMemo(() => shuffle(puzzles).slice(0, ROUND), [seed])
  const [i, setI] = useState(0)
  const [placed, setPlaced] = useState<number[]>([])
  const [solved, setSolved] = useState(0)
  const [wrong, setWrong] = useState<number | null>(null)
  const [done, setDone] = useState(false)
  const p = set[i]
  const order = useMemo(() => shuffle(p.steps.map((_, k) => k)), [p])

  function place(k: number) {
    if (k === placed.length) {
      setPlaced([...placed, k])
    } else {
      setWrong(k)
      setTimeout(() => setWrong(null), 500)
    }
  }

  function next(cleared: boolean) {
    const total = solved + (cleared ? 1 : 0)
    setSolved(total)
    if (i + 1 < ROUND) {
      setI(i + 1)
      setPlaced([])
    } else {
      setDone(true)
      onFinish(total * 25)
    }
  }

  if (done)
    return (
      <GameOver
        title={`${solved * 25} points`}
        detail={`${solved} of ${ROUND} puzzles solved.`}
        best={best}
        onRetry={() => {
          setSeed((s) => s + 1)
          setI(0)
          setPlaced([])
          setSolved(0)
          setDone(false)
        }}
      />
    )

  const complete = placed.length === p.steps.length
  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm text-muted-foreground">
        Puzzle {i + 1}/{ROUND} · Click the steps in the correct order.
      </p>
      <h2 className="mt-2 text-lg font-semibold">{p.problem}</h2>
      <ol className="math mt-4 min-h-24 space-y-2 rounded-xl border border-dashed p-3 text-sm">
        {placed.map((k) => (
          <li key={k} className="rounded-md bg-success/10 px-3 py-2">
            {p.steps[k]}
          </li>
        ))}
        {!complete && <li className="px-3 py-2 text-muted-foreground">Step {placed.length + 1}…</li>}
      </ol>
      <div className="mt-4 grid gap-2">
        {order
          .filter((k) => !placed.includes(k))
          .map((k) => (
            <button
              key={k}
              onClick={() => place(k)}
              className={cn('math rounded-xl border bg-card px-4 py-2.5 text-left text-sm hover:border-primary', wrong === k && 'border-destructive bg-destructive/10')}
            >
              {p.steps[k]}
            </button>
          ))}
      </div>
      <div className="mt-6 flex gap-3">
        {complete ? (
          <Button onClick={() => next(true)}>{i + 1 < ROUND ? 'Next puzzle' : 'Finish'}</Button>
        ) : (
          <Button variant="ghost" onClick={() => next(false)}>
            Skip
          </Button>
        )}
      </div>
    </div>
  )
}
