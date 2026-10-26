// Saved progress for quizzes and games, stored on the user's account (user_progress).
// One shared store per signed-in user: it loads once, applies changes instantly, and
// saves them in the background, newest state last.
import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { useRouteContext } from '@tanstack/react-router'
import { toast } from 'sonner'

import type { QuizQuestion } from '@/lib/content'
import { getProgress, saveProgress } from '@/lib/progress.functions'

// An unfinished quiz, so the student can pick up where they left off.
export interface QuizRun {
  order: string[] // question ids in the order shown
  choiceOrders: Record<string, number[]> // question id -> original choice indexes in display order
  i: number // current question
  score: number
  picked: number | null // original index of the choice picked for the current question
}

export interface ProgressState {
  quizBest: Record<string, number> // quiz key -> best % score
  quizAttempts: Record<string, number>
  answered: Record<string, boolean> // questionId -> answered correctly at least once
  gameBest: Record<string, number>
  quizRuns: Record<string, QuizRun> // quiz key -> unfinished run
}

// Progress saved in this browser before it moved to the account. Read once, then removed.
const LEGACY_KEY = 'formulafolio:progress:v1'
const empty: ProgressState = { quizBest: {}, quizAttempts: {}, answered: {}, gameBest: {}, quizRuns: {} }

type Updater = (s: ProgressState) => ProgressState
let store: { userId: string | null; state: ProgressState; loaded: boolean } = { userId: null, state: empty, loaded: false }
let pending: Updater[] = [] // changes made before the saved progress arrived
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

function readLegacy(): ProgressState | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    return raw ? { ...empty, ...JSON.parse(raw) } : null
  } catch {
    return null
  }
}

let saving = false
let dirty = false
async function flush() {
  if (saving) {
    dirty = true
    return
  }
  saving = true
  const userId = store.userId
  try {
    do {
      dirty = false
      await saveProgress({ data: store.state })
    } while (dirty && store.userId === userId)
  } catch {
    toast.error('Couldn’t save your progress. Check your connection; it will retry on your next answer.')
  } finally {
    saving = false
  }
}

function load(userId: string) {
  if (store.userId === userId) return
  store = { userId, state: empty, loaded: false }
  pending = []
  emit()
  getProgress()
    .then((saved) => {
      if (store.userId !== userId) return
      const legacy = saved ? null : readLegacy()
      let state: ProgressState = { ...empty, ...(saved ?? legacy ?? {}) }
      for (const fn of pending) state = fn(state)
      const changed = !!legacy || pending.length > 0
      pending = []
      store = { userId, state, loaded: true }
      emit()
      if (changed) void flush()
      if (legacy) {
        try {
          localStorage.removeItem(LEGACY_KEY)
        } catch {
          // Storage may be blocked; the copy on the account is what counts now.
        }
      }
    })
    .catch(() => {
      if (store.userId !== userId) return
      store = { ...store, loaded: true }
      emit()
      toast.error('Couldn’t load your saved progress.')
    })
}

export function useProgress() {
  const { viewer } = useRouteContext({ from: '/app' })
  useEffect(() => load(viewer.id), [viewer.id])
  const state = useSyncExternalStore(subscribe, () => (store.userId === viewer.id ? store.state : empty), () => empty)
  const loaded = useSyncExternalStore(subscribe, () => store.userId === viewer.id && store.loaded, () => false)

  const update = useCallback(
    (fn: Updater) => {
      if (store.userId !== viewer.id) return
      if (!store.loaded) {
        pending.push(fn)
        store = { ...store, state: fn(store.state) }
        emit()
        return
      }
      store = { ...store, state: fn(store.state) }
      emit()
      void flush()
    },
    [viewer.id],
  )

  return { progress: state, update, loaded }
}

// A lesson's progress is the share of its quiz questions answered correctly at least once.
export function lessonPct(progress: ProgressState, questions: QuizQuestion[], lessonId: string) {
  const qs = questions.filter((q) => q.lessonId === lessonId)
  if (qs.length === 0) return 0
  return Math.round((qs.filter((q) => progress.answered[q.id]).length / qs.length) * 100)
}
