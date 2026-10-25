// Saved progress for quizzes and games. Browser storage for now; a later
// milestone swaps this for a Supabase `progress` table (see PLAN.md).
import { useCallback, useEffect, useState } from 'react'

export interface ProgressState {
  quizBest: Record<string, number> // topic -> best % score
  quizAttempts: Record<string, number>
  answered: Record<string, boolean> // questionId -> answered correctly at least once
  gameBest: Record<string, number>
}

const KEY = 'formulafolio:progress:v1'
const empty: ProgressState = { quizBest: {}, quizAttempts: {}, answered: {}, gameBest: {} }

export function useProgress() {
  const [state, setState] = useState<ProgressState>(empty)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setState({ ...empty, ...JSON.parse(raw) })
    } catch {
      // Ignore corrupt storage and start fresh.
    }
  }, [])

  const update = useCallback((fn: (s: ProgressState) => ProgressState) => {
    setState((prev) => {
      const next = fn(prev)
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { progress: state, update }
}
