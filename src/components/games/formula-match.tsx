import { useMemo, useState } from 'react'

import { cn } from '@/lib/utils'
import { formulaPairs, GameOver, shuffle, type GameProps } from './shared'

const ROUND = 6

export function FormulaMatch({ onFinish, best }: GameProps) {
  const [seed, setSeed] = useState(0)
  const pairs = useMemo(() => shuffle(formulaPairs).slice(0, ROUND), [seed])
  const right = useMemo(() => shuffle(pairs), [pairs])
  const [selected, setSelected] = useState<string | null>(null)
  const [matched, setMatched] = useState<string[]>([])
  const [miss, setMiss] = useState<string | null>(null)
  const [mistakes, setMistakes] = useState(0)

  const finished = matched.length === ROUND
  const score = Math.max(0, ROUND * 10 - mistakes * 3)

  function pickRight(id: string) {
    if (!selected || matched.includes(id)) return
    if (id === selected) {
      const next = [...matched, id]
      setMatched(next)
      setSelected(null)
      if (next.length === ROUND) onFinish(score)
    } else {
      setMistakes((m) => m + 1)
      setMiss(id)
      setTimeout(() => setMiss(null), 500)
    }
  }

  if (finished)
    return (
      <GameOver
        title={`${score} points`}
        detail={`All ${ROUND} matched with ${mistakes} mistake${mistakes === 1 ? '' : 's'}.`}
        best={best}
        onRetry={() => {
          setSeed((s) => s + 1)
          setMatched([])
          setMistakes(0)
        }}
      />
    )

  const tile = 'w-full rounded-xl border bg-card px-4 py-3 text-left text-sm transition-colors motion-reduce:transition-none'
  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">Pick a name on the left, then its formula on the right. Mistakes: {mistakes}</p>
      <div className="grid gap-6 md:grid-cols-2">
        <ul className="space-y-2">
          {pairs.map((p) => (
            <li key={p.id}>
              <button
                disabled={matched.includes(p.id)}
                onClick={() => setSelected(p.id)}
                className={cn(tile, selected === p.id && 'border-primary bg-secondary', matched.includes(p.id) && 'border-success bg-success/10 opacity-60')}
              >
                {p.label}
              </button>
            </li>
          ))}
        </ul>
        <ul className="space-y-2">
          {right.map((p) => (
            <li key={p.id}>
              <button
                disabled={matched.includes(p.id)}
                onClick={() => pickRight(p.id)}
                className={cn(tile, 'math', !selected && 'cursor-default', miss === p.id && 'border-destructive bg-destructive/10', matched.includes(p.id) && 'border-success bg-success/10 opacity-60')}
              >
                {p.expr}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
