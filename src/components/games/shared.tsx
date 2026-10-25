import { RotateCcw, Trophy } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { lessons } from '@/data/lessons'

export interface GameProps {
  onFinish: (score: number) => void
  best?: number
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Every named formula in the lesson catalog, used by Match and Memory.
export const formulaPairs = lessons.flatMap((l) =>
  l.formulas.map((f, i) => ({ id: `${l.id}-${i}`, label: `${l.title.split(' ')[0]} · ${f.label}`, expr: f.expr })),
)

export function GameOver({ title, detail, best, onRetry }: { title: string; detail: string; best?: number; onRetry: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-card p-8 text-center" role="status">
      <Trophy className="mx-auto size-12 text-highlight" />
      <h2 className="mt-4 font-display text-3xl font-bold">{title}</h2>
      <p className="mt-1 text-muted-foreground">{detail}</p>
      {best !== undefined && <p className="mt-1 text-sm text-muted-foreground">Best: {best}</p>}
      <Button className="mt-6" onClick={onRetry}>
        <RotateCcw /> Play again
      </Button>
    </div>
  )
}
