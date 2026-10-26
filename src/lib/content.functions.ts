import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { clearContentCache, loadContent, loadPublishedContent } from '@/lib/content.server'
import { getSupabase, requireAdmin } from '@/lib/supabase.server'

const topicId = z.enum(['trig', 'exp', 'log'])
const text = (max: number) => z.string().trim().max(max)
const required = (max: number) => z.string().trim().min(1, 'Required.').max(max)

export const getContent = createServerFn({ method: 'GET' }).handler(() => loadPublishedContent(getSupabase()))

// Everything, including hidden rows, for the admin editors.
export const getAdminContent = createServerFn({ method: 'GET' }).handler(async () => {
  const sb = getSupabase()
  await requireAdmin(sb)
  return loadContent(sb, false)
})

// Runs an admin write, clears the cache, and turns database errors into readable messages.
async function adminWrite(run: (sb: ReturnType<typeof getSupabase>) => PromiseLike<{ error: { code?: string; message: string } | null }>) {
  const sb = getSupabase()
  await requireAdmin(sb)
  const { error } = await run(sb)
  if (error) {
    console.error('Content write failed:', error.message)
    if (error.code === '23505') throw new Error('That ID is already used. Pick another.')
    if (error.code === '23503') throw new Error('Other records still use this item. Hide it instead of deleting it.')
    if (error.code === '23514') throw new Error('Some values are out of range. Check the form and try again.')
    throw new Error('Could not save the change.')
  }
  clearContentCache()
}

async function nextSort(sb: ReturnType<typeof getSupabase>, table: string) {
  const { data } = await sb.from(table).select('sort').order('sort', { ascending: false }).limit(1)
  return (data?.[0]?.sort ?? -1) + 1
}

export const saveTopic = createServerFn({ method: 'POST' })
  .validator(z.object({ id: topicId, name: required(80), short: required(30), blurb: text(300) }))
  .handler(({ data: { id, ...fields } }) => adminWrite((sb) => sb.from('topics').update(fields).eq('id', id)))

const lessonInput = z.object({
  isNew: z.boolean(),
  id: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and single dashes.'),
  topic: topicId,
  title: required(120),
  minutes: z.number().int().min(1).max(240),
  level: z.enum(['Foundations', 'Core', 'Applied']),
  summary: text(500),
  formulas: z.array(z.object({ label: required(120), expr: required(300) })).max(20),
  explanation: z.array(required(3000)).max(20),
  examples: z.array(z.object({ problem: required(500), steps: z.array(required(500)).max(12), answer: required(300) })).max(10),
  practice: z.array(z.object({ prompt: required(500), answer: required(300), hint: text(500) })).max(10),
  keywords: z.array(required(60)).max(40),
  published: z.boolean(),
})

export const saveLesson = createServerFn({ method: 'POST' })
  .validator(lessonInput)
  .handler(({ data: { isNew, topic, ...l } }) =>
    adminWrite(async (sb) => {
      const row = { ...l, topic_id: topic }
      if (!isNew) return sb.from('lessons').update(row).eq('id', l.id)
      return sb.from('lessons').insert({ ...row, sort: await nextSort(sb, 'lessons') })
    }),
  )

export const deleteLesson = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(({ data }) => adminWrite((sb) => sb.from('lessons').delete().eq('id', data.id)))

const questionInput = z
  .object({
    id: z.string().optional(),
    lessonId: z.string().min(1, 'Pick a lesson.'),
    prompt: required(500),
    choices: z.array(required(300)).min(2, 'Add at least two choices.').max(6),
    answer: z.number().int().min(0),
    explanation: text(1000),
    published: z.boolean(),
  })
  .refine((q) => q.answer < q.choices.length, 'Mark which choice is correct.')

export const saveQuestion = createServerFn({ method: 'POST' })
  .validator(questionInput)
  .handler(({ data: { id, lessonId, ...q } }) =>
    adminWrite(async (sb) => {
      const row = { ...q, lesson_id: lessonId }
      if (id) return sb.from('questions').update(row).eq('id', id)
      return sb.from('questions').insert({ ...row, sort: await nextSort(sb, 'questions') })
    }),
  )

export const deleteQuestion = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(({ data }) => adminWrite((sb) => sb.from('questions').delete().eq('id', data.id)))

const errorItemInput = z
  .object({
    id: z.string().optional(),
    topic: topicId.nullable(),
    problem: required(300),
    steps: z.array(required(300)).min(2, 'Add at least two steps.').max(8),
    wrong: z.number().int().min(0),
    why: required(1000),
    published: z.boolean(),
  })
  .refine((e) => e.wrong < e.steps.length, 'Mark which step is wrong.')

export const saveErrorItem = createServerFn({ method: 'POST' })
  .validator(errorItemInput)
  .handler(({ data: { id, topic, ...e } }) =>
    adminWrite(async (sb) => {
      const row = { ...e, topic_id: topic }
      if (id) return sb.from('error_items').update(row).eq('id', id)
      return sb.from('error_items').insert({ ...row, sort: await nextSort(sb, 'error_items') })
    }),
  )

export const deleteErrorItem = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(({ data }) => adminWrite((sb) => sb.from('error_items').delete().eq('id', data.id)))

// Quick show/hide from the editor lists.
export const setPublished = createServerFn({ method: 'POST' })
  .validator(z.object({ table: z.enum(['lessons', 'questions', 'error_items']), id: z.string().min(1), published: z.boolean() }))
  .handler(({ data }) => adminWrite((sb) => sb.from(data.table).update({ published: data.published }).eq('id', data.id)))
