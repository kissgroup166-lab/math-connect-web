import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { getSupabase, requireUserId } from '@/lib/supabase.server'

// Shapes are bounded so one account can't store unbounded JSON.
const pct = z.number().min(0).max(100)
const count = z.number().int().min(0).max(1_000_000)
const keyed = <T extends z.ZodTypeAny>(v: T, max: number) => z.record(z.string().max(80), v).refine((r) => Object.keys(r).length <= max, 'Too many entries.')

const quizRun = z.object({
  order: z.array(z.string().max(80)).max(500),
  choiceOrders: keyed(z.array(z.number().int().min(0).max(5)).max(6), 500),
  i: z.number().int().min(0).max(500),
  score: z.number().int().min(0).max(500),
  picked: z.number().int().min(0).max(5).nullable(),
})

const progressInput = z.object({
  quizBest: keyed(pct, 10),
  quizAttempts: keyed(count, 10),
  answered: keyed(z.boolean(), 5000),
  gameBest: keyed(z.number().min(0).max(1_000_000), 20),
  quizRuns: keyed(quizRun, 10),
})

export type ProgressInput = z.infer<typeof progressInput>

// The signed-in user's saved progress, or null if they have never saved any.
export const getProgress = createServerFn({ method: 'GET' }).handler(async (): Promise<ProgressInput | null> => {
  const sb = getSupabase()
  const userId = await requireUserId(sb)
  const { data, error } = await sb.from('user_progress').select('*').eq('user_id', userId).maybeSingle()
  if (error) {
    console.error('Loading progress failed:', error.message)
    throw new Error('Could not load your progress.')
  }
  if (!data) return null
  return { quizBest: data.quiz_best, quizAttempts: data.quiz_attempts, answered: data.answered, gameBest: data.game_best, quizRuns: data.quiz_runs }
})

export const saveProgress = createServerFn({ method: 'POST' })
  .validator(progressInput)
  .handler(async ({ data }) => {
    const sb = getSupabase()
    const userId = await requireUserId(sb)
    const { error } = await sb.from('user_progress').upsert({
      user_id: userId,
      quiz_best: data.quizBest,
      quiz_attempts: data.quizAttempts,
      answered: data.answered,
      game_best: data.gameBest,
      quiz_runs: data.quizRuns,
    })
    if (error) {
      console.error('Saving progress failed:', error.message)
      throw new Error('Could not save your progress.')
    }
  })
