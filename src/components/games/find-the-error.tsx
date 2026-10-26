import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useContent, type ErrorItem } from '@/lib/content'
import { cn } from '@/lib/utils'
import { GameOver, NotEnoughContent, shuffle, type GameProps } from './shared'

const ROUND = 5

// Items are edited by the admin under Admin → Games.
export function FindTheError(props: GameProps) {
  const { errorItems } = useContent()
  if (errorItems.length < ROUND) return <NotEnoughContent what="Find the Error items" />
  return <Round {...props} pool={errorItems} />
}

function Round({ onFinish, best, pool }: GameProps & { pool: ErrorItem[] }) {
  const [seed, setSeed] = useState(0)
  const set = useMemo(() => shuffle(pool).slice(0, ROUND), [seed, pool])
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const it = set[i]

  function pick(k: number) {
    if (picked !== null) return
    setPicked(k)
    if (k === it.wrong) setScore((s) => s + 20)
  }

  function next() {
    if (i + 1 < ROUND) {
      setI(i + 1)
      setPicked(null)
    } else {
      setDone(true)
      onFinish(score)
    }
  }

  if (done)
    return (
      <GameOver
        title={`${score} points`}
        detail={`You spotted ${score / 20} of ${ROUND} errors.`}
        best={best}
        onRetry={() => {
          setSeed((s) => s + 1)
          setI(0)
          setPicked(null)
          setScore(0)
          setDone(false)
        }}
      />
    )

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm text-muted-foreground">
        Solution {i + 1}/{ROUND} · Click the step that contains the mistake.
      </p>
      <h2 className="mt-2 text-lg font-semibold">{it.problem}</h2>
      <ol className="mt-4 space-y-2">
        {it.steps.map((s, k) => (
          <li key={k}>
            <button
              onClick={() => pick(k)}
              disabled={picked !== null}
              className={cn(
                'math w-full rounded-xl border bg-card px-4 py-3 text-left text-sm',
                picked === null && 'hover:border-primary',
                picked !== null && k === it.wrong && 'border-destructive bg-destructive/10',
                picked === k && k !== it.wrong && 'border-chart-2 bg-accent',
              )}
            >
              <span className="mr-3 text-muted-foreground">{k + 1}</span>
              {s}
            </button>
          </li>
        ))}
      </ol>
      {picked !== null && (
        <div className="mt-4 rounded-xl bg-muted p-4" aria-live="polite">
          <p className={cn('font-semibold', picked === it.wrong ? 'text-success' : 'text-destructive')}>
            {picked === it.wrong ? 'Spotted it!' : `The error is in step ${it.wrong + 1}.`}
          </p>
          <p className="mt-1 text-sm">{it.why}</p>
          <Button className="mt-4" onClick={next}>
            {i + 1 < ROUND ? 'Next' : 'Finish'}
          </Button>
        </div>
      )}
    </div>
  )
}
