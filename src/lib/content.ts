// Course content (topics, lessons, quiz questions, Find the Error items). It lives in
// Supabase so the admin can edit it; the seed is in supabase/migrations/*_content.sql.
// Keywords and formulas are also what the PDF relevance check compares uploads against.
import { useMemo } from 'react'
import { useRouteContext } from '@tanstack/react-router'

import { getContent } from '@/lib/content.functions'

export type TopicId = 'trig' | 'exp' | 'log'
export const topicIds = ['trig', 'exp', 'log'] as const satisfies readonly TopicId[]
export const levels = ['Foundations', 'Core', 'Applied'] as const

export interface Topic {
  id: TopicId
  name: string
  short: string
  blurb: string
}

export interface WorkedExample {
  problem: string
  steps: string[]
  answer: string
}

export interface PracticeItem {
  prompt: string
  answer: string
  hint: string
}

export interface Lesson {
  id: string
  topic: TopicId
  title: string
  minutes: number
  level: (typeof levels)[number]
  summary: string
  formulas: { label: string; expr: string }[]
  explanation: string[]
  examples: WorkedExample[]
  practice: PracticeItem[]
  keywords: string[]
  published: boolean
}

export interface QuizQuestion {
  id: string
  topic: TopicId
  lessonId: string
  prompt: string
  choices: string[]
  answer: number // index into choices
  explanation: string
  published: boolean
}

export interface ErrorItem {
  id: string
  topic: TopicId | null
  problem: string
  steps: string[]
  wrong: number // index of the incorrect step
  why: string
  published: boolean
}

// A topic quiz, or `all` for the mixed review.
export type QuizKey = TopicId | 'all'
export const quizKeys = ['trig', 'exp', 'log', 'all'] as const satisfies readonly QuizKey[]

export interface QuizSettings {
  shuffleQuestions: boolean
  shuffleChoices: boolean
}

export interface Content {
  topics: Topic[]
  lessons: Lesson[]
  questions: QuizQuestion[]
  errorItems: ErrorItem[]
  quizSettings: Record<QuizKey, QuizSettings>
}

export const PASS_MARK = 0.7

export function getLesson(content: Content, id: string) {
  return content.lessons.find((l) => l.id === id)
}

export function getTopic(content: Content, id: TopicId) {
  return content.topics.find((t) => t.id === id) ?? { id, name: id, short: id, blurb: '' }
}

// Published content for the whole site, loaded by the root route. Pages read it with useContent().
export function useContent() {
  const content = useRouteContext({ from: '__root__', select: (c) => c.content })
  return useMemo(
    () => ({
      ...content,
      getLesson: (id: string) => getLesson(content, id),
      getTopic: (id: TopicId) => getTopic(content, id),
    }),
    [content],
  )
}

// Content changes rarely, so client navigations reuse it for a few minutes instead of a
// round trip per click. Admin edits call forgetContent() and then router.invalidate().
const TTL_MS = 5 * 60_000
let cached: { content: Content; at: number } | null = null

export function forgetContent() {
  cached = null
}

export async function currentContent() {
  // Module state is shared across requests on the server, which caches separately.
  if (typeof window === 'undefined') return getContent()
  if (cached && Date.now() - cached.at < TTL_MS) return cached.content
  const content = await getContent()
  cached = { content, at: Date.now() }
  return content
}

export function rememberContent(content: Content) {
  if (typeof window !== 'undefined' && !cached) cached = { content, at: Date.now() }
}
