import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { GameOver, shuffle, type GameProps } from './shared'

const items = [
  {
    problem: 'Expand log(x + y)·z',
    steps: ['log((x + y)z)', '= log(x + y) + log z', '= log x + log y + log z'],
    wrong: 2,
    why: 'There is no law for log(x + y). It cannot be split into log x + log y.',
  },
  {
    problem: 'Solve 2ˣ = 32',
    steps: ['2ˣ = 2⁵', 'x = 5', 'Check: 2⁵ = 25 ✓'],
    wrong: 2,
    why: '2⁵ = 32, not 25. Powers are not multiplication.',
  },
  {
    problem: 'Find cos θ if sin θ = 3/5, θ in QII',
    steps: ['cos²θ = 1 − 9/25', 'cos²θ = 16/25', 'cos θ = 4/5'],
    wrong: 2,
    why: 'Cosine is negative in Quadrant II, so cos θ = −4/5.',
  },
  {
    problem: 'Simplify sin 2x',
    steps: ['sin 2x = sin(x + x)', '= sin x cos x + cos x sin x', '= 2 sin x'],
    wrong: 2,
    why: 'The sum gives 2 sin x cos x. The cos x factor was dropped.',
  },
  {
    problem: 'Solve log₂ x + log₂(x − 2) = 3',
    steps: ['log₂(x(x − 2)) = 3', 'x² − 2x = 8', 'x = 4 or x = −2, both valid'],
    wrong: 2,
    why: 'x = −2 makes log₂ x undefined, so it is extraneous. Only x = 4 works.',
  },
  {
    problem: 'Evaluate ln(e³ · e²)',
    steps: ['= ln(e⁶)', '= 6'],
    wrong: 0,
    why: 'e³ · e² = e⁵. Multiplying powers adds exponents, it does not multiply them.',
  },
  {
    problem: 'Continuous growth: $200 at 5% for 4 years',
    steps: ['A = Peʳᵗ', 'A = 200e^(5 · 4)', 'A ≈ 200 · 1.2214 ≈ $244.28'],
    wrong: 1,
    why: 'The rate must be a decimal: r = 0.05, so the exponent is 0.05 · 4 = 0.2.',
  },
  {
    problem: 'Simplify 1 − 2 sin²θ',
    steps: ['1 − 2 sin²θ = cos 2θ', 'So 1 − 2 sin²θ = sin 2θ'],
    wrong: 1,
    why: '1 − 2 sin²θ is one of the forms of cos 2θ, not sin 2θ.',
  },
]
const ROUND = 5

export function FindTheError({ onFinish, best }: GameProps) {
  const [seed, setSeed] = useState(0)
  const set = useMemo(() => shuffle(items).slice(0, ROUND), [seed])
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
