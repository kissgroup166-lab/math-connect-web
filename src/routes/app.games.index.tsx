import { createFileRoute, Link } from '@tanstack/react-router'

import { PageHeader } from '@/components/app-shell'
import { games } from '@/components/games'
import { useProgress } from '@/lib/progress'

export const Route = createFileRoute('/app/games/')({
  head: () => ({ meta: [{ title: 'Games · MathConnect' }] }),
  component: Games,
})

function Games() {
  const { progress } = useProgress()
  return (
    <>
      <PageHeader title="Games" description="Five quick ways to drill the formulas. Your best score for each game is saved." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((g) => (
          <Link
            key={g.id}
            to="/app/games/$gameId"
            params={{ gameId: g.id }}
            className="group flex flex-col rounded-2xl border bg-card p-6 transition-shadow hover:shadow-md motion-reduce:transition-none"
          >
            <span className="grid size-12 place-items-center rounded-xl bg-primary text-highlight">
              <g.icon className="size-6" />
            </span>
            <h2 className="mt-4 font-display text-lg font-bold">{g.name}</h2>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">{g.blurb}</p>
            <p className="mt-4 flex items-center justify-between text-sm">
              <span className="font-semibold text-primary group-hover:underline">Play →</span>
              {progress.gameBest[g.id] !== undefined && <span className="math text-xs text-muted-foreground">Best {progress.gameBest[g.id]}</span>}
            </p>
          </Link>
        ))}
      </div>
    </>
  )
}
