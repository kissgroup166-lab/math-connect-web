// Server-only content loading. Published content is the same for every visitor, so it is
// cached in memory briefly; admin writes clear the cache in this process.
import type { getSupabase } from '@/lib/supabase.server'
import type { Content, ErrorItem, Lesson, QuizQuestion, Topic, TopicId } from '@/lib/content'

type Sb = ReturnType<typeof getSupabase>

const TTL_MS = 60_000
let cache: { content: Content; at: number } | null = null

export function clearContentCache() {
  cache = null
}

// Rows the admin hid stay out of everything students see. RLS lets the admin read them,
// so the published filter is applied here too.
export async function loadPublishedContent(sb: Sb): Promise<Content> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.content
  const content = await loadContent(sb, true)
  cache = { content, at: Date.now() }
  return content
}

export async function loadContent(sb: Sb, publishedOnly: boolean): Promise<Content> {
  const only = <T extends { published: boolean }>(rows: T[]) => (publishedOnly ? rows.filter((r) => r.published) : rows)
  const [t, l, q, e] = await Promise.all([
    sb.from('topics').select('*').order('sort'),
    sb.from('lessons').select('*').order('sort').order('id'),
    sb.from('questions').select('*').order('sort').order('id'),
    sb.from('error_items').select('*').order('sort').order('id'),
  ])
  const failed = t.error ?? l.error ?? q.error ?? e.error
  if (failed) {
    console.error('Loading content failed:', failed.message)
    throw new Error(
      failed.code === '42P01' || failed.code === 'PGRST205'
        ? 'The content tables are missing. Run supabase/migrations/20261028000000_content.sql on the database.'
        : 'Could not load the course content.',
    )
  }

  const topics: Topic[] = (t.data ?? []).map((r) => ({ id: r.id, name: r.name, short: r.short, blurb: r.blurb }))
  const lessons: Lesson[] = only(
    (l.data ?? []).map((r) => ({
      id: r.id,
      topic: r.topic_id,
      title: r.title,
      minutes: r.minutes,
      level: r.level,
      summary: r.summary,
      formulas: r.formulas,
      explanation: r.explanation,
      examples: r.examples,
      practice: r.practice,
      keywords: r.keywords,
      published: r.published,
    })),
  )
  // A question takes its topic from its lesson, and disappears with a hidden lesson.
  const topicOf = new Map<string, TopicId>(lessons.map((x) => [x.id, x.topic]))
  const questions: QuizQuestion[] = only(
    (q.data ?? [])
      .filter((r) => topicOf.has(r.lesson_id))
      .map((r) => ({
        id: r.id,
        topic: topicOf.get(r.lesson_id)!,
        lessonId: r.lesson_id,
        prompt: r.prompt,
        choices: r.choices,
        answer: r.answer,
        explanation: r.explanation,
        published: r.published,
      })),
  )
  const errorItems: ErrorItem[] = only(
    (e.data ?? []).map((r) => ({ id: r.id, topic: r.topic_id, problem: r.problem, steps: r.steps, wrong: r.wrong, why: r.why, published: r.published })),
  )
  return { topics, lessons, questions, errorItems }
}
