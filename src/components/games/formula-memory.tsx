import { useMemo, useState } from 'react'

import { cn } from '@/lib/utils'
import { useContent } from '@/lib/content'
import { formulaPairsOf, GameOver, NotEnoughContent, shuffle, type FormulaPair, type GameProps } from './shared'

const PAIRS = 6

export function FormulaMemory(props: GameProps) {
  const { lessons } = useContent()
  const pool = useMemo(() => formulaPairsOf(lessons), [lessons])
  if (pool.length < PAIRS) return <NotEnoughContent what="formulas" />
  return <Memory {...props} pool={pool} />
}

function Memory({ onFinish, best, pool }: GameProps & { pool: FormulaPair[] }) {
  const [seed, setSeed] = useState(0)
  const cards = useMemo(
    () =>
      shuffle(
        shuffle(pool)
          .slice(0, PAIRS)
          .flatMap((p) => [
            { key: `${p.id}-n`, pair: p.id, text: p.label, math: false },
            { key: `${p.id}-f`, pair: p.id, text: p.expr, math: true },
          ]),
      ),
    [seed, pool],
  )
  const [open, setOpen] = useState<number[]>([])
  const [found, setFound] = useState<string[]>([])
  const [moves, setMoves] = useState(0)

  const finished = found.length === PAIRS
  const score = Math.max(10, 100 - Math.max(0, moves - PAIRS) * 5)

  function flip(idx: number) {
    if (open.length === 2 || open.includes(idx) || found.includes(cards[idx].pair)) return
    const next = [...open, idx]
    setOpen(next)
    if (next.length === 2) {
      setMoves((m) => m + 1)
      const [a, b] = next.map((k) => cards[k])
      if (a.pair === b.pair) {
        const f = [...found, a.pair]
        setFound(f)
        setOpen([])
        if (f.length === PAIRS) onFinish(Math.max(10, 100 - Math.max(0, moves + 1 - PAIRS) * 5))
      } else {
        setTimeout(() => setOpen([]), 900)
      }
    }
  }

  if (finished)
    return (
      <GameOver
        title={`${score} points`}
        detail={`Cleared in ${moves} moves.`}
        best={best}
        onRetry={() => {
          setSeed((s) => s + 1)
          setFound([])
          setOpen([])
          setMoves(0)
        }}
      />
    )

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">Flip two cards to match each formula name with its formula. Moves: {moves}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {cards.map((c, idx) => {
          const faceUp = open.includes(idx) || found.includes(c.pair)
          return (
            <button
              key={c.key}
              onClick={() => flip(idx)}
              aria-label={faceUp ? c.text : 'Hidden card'}
              className={cn(
                'grid min-h-28 place-items-center rounded-xl border p-3 text-center text-xs transition-colors motion-reduce:transition-none',
                faceUp ? 'bg-card' : 'graph-paper bg-primary text-primary-foreground hover:bg-primary/90',
                found.includes(c.pair) && 'border-success bg-success/10',
                c.math && faceUp && 'math text-sm',
              )}
            >
              {faceUp ? c.text : <span className="font-display text-2xl font-bold text-highlight">Σ</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
