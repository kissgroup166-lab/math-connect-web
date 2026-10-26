import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Pencil, Plus } from 'lucide-react'

import { Field, PublishedSwitch, Section, useContentAction } from '@/components/admin-editor'
import { PageHeader } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Topic } from '@/lib/content'
import { getAdminContent, saveTopic } from '@/lib/content.functions'

export const Route = createFileRoute('/app/admin/lessons/')({
  head: () => ({ meta: [{ title: 'Topics & lessons · MathConnect' }] }),
  loader: () => getAdminContent(),
  component: LessonsAdmin,
})

function TopicForm({ topic }: { topic: Topic }) {
  const { busy, run } = useContentAction()
  const [t, setT] = useState(topic)
  const changed = t.name !== topic.name || t.short !== topic.short || t.blurb !== topic.blurb
  return (
    <form
      className="space-y-3 rounded-xl border bg-background p-4"
      onSubmit={(e) => {
        e.preventDefault()
        void run(() => saveTopic({ data: t }), `Saved ${t.name}`)
      }}
    >
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
        <Field label="Name" htmlFor={`topic-name-${t.id}`}>
          <Input id={`topic-name-${t.id}`} value={t.name} maxLength={80} required onChange={(e) => setT({ ...t, name: e.target.value })} />
        </Field>
        <Field label="Short name" htmlFor={`topic-short-${t.id}`}>
          <Input id={`topic-short-${t.id}`} value={t.short} maxLength={30} required onChange={(e) => setT({ ...t, short: e.target.value })} />
        </Field>
      </div>
      <Field label="Description" htmlFor={`topic-blurb-${t.id}`}>
        <Textarea id={`topic-blurb-${t.id}`} value={t.blurb} maxLength={300} onChange={(e) => setT({ ...t, blurb: e.target.value })} className="min-h-16" />
      </Field>
      <Button type="submit" size="sm" disabled={busy || !changed}>
        {busy ? 'Saving…' : 'Save topic'}
      </Button>
    </form>
  )
}

function LessonsAdmin() {
  const { topics, lessons, questions } = Route.useLoaderData()
  return (
    <>
      <PageHeader
        title="Topics & lessons"
        description="Edit what students read. Lesson keywords and formulas also drive the relevance score for uploaded PDFs."
        action={
          <Button asChild>
            <Link to="/app/admin/lessons/$lessonId" params={{ lessonId: 'new' }}>
              <Plus /> New lesson
            </Link>
          </Button>
        }
      />
      <div className="space-y-6">
        {topics.map((t) => {
          const ls = lessons.filter((l) => l.topic === t.id)
          return (
            <Section key={t.id} title={t.name} description={`${ls.length} lesson${ls.length === 1 ? '' : 's'}`}>
              <TopicForm key={`${t.name}|${t.short}|${t.blurb}`} topic={t} />
              {ls.length === 0 ? (
                <p className="text-sm text-muted-foreground">No lessons in this topic yet.</p>
              ) : (
                <ul className="divide-y rounded-xl border bg-background">
                  {ls.map((l) => {
                    const qs = questions.filter((q) => q.lessonId === l.id).length
                    return (
                      <li key={l.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{l.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {l.level} · {l.minutes} min · {l.formulas.length} formulas · {l.examples.length} examples · {qs} quiz question{qs === 1 ? '' : 's'}
                          </p>
                        </div>
                        <PublishedSwitch table="lessons" id={l.id} published={l.published} label={l.title} />
                        <Button asChild size="sm" variant="outline">
                          <Link to="/app/admin/lessons/$lessonId" params={{ lessonId: l.id }}>
                            <Pencil /> Edit
                          </Link>
                        </Button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Section>
          )
        })}
      </div>
    </>
  )
}
