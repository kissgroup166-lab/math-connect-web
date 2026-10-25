import { useCallback, useEffect, useRef } from 'react'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/app-shell'
import { getGame } from '@/components/games'
import { useProgress } from '@/lib/progress'

export const Route = createFileRoute('/app/games/$gameId')({
  loader: ({ params }) => {
    if (!getGame(params.gameId)) throw notFound()
    return { gameId: params.gameId }
  },
  head: ({ params }) => ({ meta: [{ title: `${getGame(params.gameId)?.name ?? 'Game'} · MathConnect` }] }),
  component: GamePage,
})

function GamePage() {
  const { gameId } = Route.useLoaderData()
  const game = getGame(gameId)!
  const { progress, update } = useProgress()
  const best = progress.gameBest[game.id]
  const bestRef = useRef(best)
  useEffect(() => {
    bestRef.current = best
  }, [best])

  const onFinish = useCallback(
    (score: number) => {
      if (bestRef.current === undefined || score > bestRef.current) toast.success('New best score saved!')
      update((p) => ({ ...p, gameBest: { ...p.gameBest, [game.id]: Math.max(score, p.gameBest[game.id] ?? 0) } }))
    },
    [game.id, update],
  )

  return (
    <>
      <Link to="/app/games" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All games
      </Link>
      <PageHeader title={game.name} description={game.blurb} />
      <game.Component key={game.id} onFinish={onFinish} best={best} />
    </>
  )
}
