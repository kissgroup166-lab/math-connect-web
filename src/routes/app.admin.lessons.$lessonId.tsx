import { useState } from 'react'
import { createFileRoute, Link, notFound, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, ExternalLink } from 'lucide-react'

import { ConfirmDelete, Field, Repeater, Section, StringList, useContentAction } from '@/components/admin-editor'
import { PageHeader } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { levels, type Lesson, type TopicId } from '@/lib/content'
import { deleteLesson, getAdminContent, saveLesson } from '@/lib/content.functions'

// `new` opens a blank lesson; any other value edits that lesson.
export const Route = createFileRoute('/app/admin/lessons/$lessonId')({
  loader: async ({ params }) => {
    const content = await getAdminContent()
    if (params.lessonId === 'new') return { content, lesson: null }
    const lesson = content.lessons.find((l) => l.id === params.lessonId)
    if (!lesson) throw notFound()
    return { content, lesson }
  },
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.lesson ? `Edit ${loaderData.lesson.title}` : 'New lesson'} · MathConnect` }] }),
  component: LessonEditor,
})

const blank: Lesson = {
  id: '',
  topic: 'trig',
  title: '',
  minutes: 10,
  level: 'Core',
  summary: '',
  formulas: [],
  explanation: [''],
  examples: [],
  practice: [],
  keywords: [],
  published: false,
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

function LessonEditor() {
  const { content, lesson: existing } = Route.useLoaderData()
  const navigate = useNavigate()
  const isNew = !existing
  const [l, setL] = useState<Lesson>(existing ?? blank)
  const [idTouched, setIdTouched] = useState(false)
  const [keywords, setKeywords] = useState((existing ?? blank).keywords.join(', '))
  const { busy, run } = useContentAction()
  const set = <K extends keyof Lesson>(k: K, v: Lesson[K]) => setL((prev) => ({ ...prev, [k]: v }))
  const questionCount = existing ? content.questions.filter((q) => q.lessonId === existing.id).length : 0

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const data = {
      ...l,
      isNew,
      explanation: l.explanation.filter((p) => p.trim()),
      keywords: keywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean),
    }
    const ok = await run(() => saveLesson({ data }), isNew ? 'Lesson created' : 'Lesson saved')
    if (ok && isNew) await navigate({ to: '/app/admin/lessons/$lessonId', params: { lessonId: data.id }, replace: true })
  }

  return (
    <>
      <Link to="/app/admin/lessons" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Topics & lessons
      </Link>
      <PageHeader
        title={isNew ? 'New lesson' : `Edit: ${existing.title}`}
        description="Changes show to students as soon as you save."
        action={
          !isNew && (
            <Button asChild variant="outline" size="sm">
              <Link to="/app/learn/$lessonId" params={{ lessonId: existing.id }}>
                <ExternalLink /> View as student
              </Link>
            </Button>
          )
        }
      />
      <form className="space-y-6" onSubmit={save}>
        <Section title="Basics">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" htmlFor="title">
              <Input
                id="title"
                value={l.title}
                required
                maxLength={120}
                onChange={(e) => {
                  const title = e.target.value
                  setL((prev) => ({ ...prev, title, id: isNew && !idTouched ? slugify(title) : prev.id }))
                }}
              />
            </Field>
            <Field
              label="Lesson ID"
              htmlFor="lesson-id"
              hint={isNew ? 'Used in the lesson’s web address. It can’t be changed later.' : 'Used in the lesson’s web address. It can’t be changed.'}
            >
              <Input
                id="lesson-id"
                value={l.id}
                required
                disabled={!isNew}
                maxLength={80}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                title="Lowercase letters, numbers, and single dashes"
                className="math"
                onChange={(e) => {
                  setIdTouched(true)
                  set('id', e.target.value)
                }}
              />
            </Field>
            <Field label="Topic" htmlFor="topic">
              <Select value={l.topic} onValueChange={(v) => set('topic', v as TopicId)}>
                <SelectTrigger id="topic" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {content.topics.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Level" htmlFor="level">
                <Select value={l.level} onValueChange={(v) => set('level', v as Lesson['level'])}>
                  <SelectTrigger id="level" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((lv) => (
                      <SelectItem key={lv} value={lv}>
                        {lv}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Minutes" htmlFor="minutes">
                <Input
                  id="minutes"
                  type="number"
                  min={1}
                  max={240}
                  required
                  value={l.minutes}
                  onChange={(e) => set('minutes', Number(e.target.value))}
                />
              </Field>
            </div>
          </div>
          <Field label="Summary" htmlFor="summary" hint="One or two sentences shown on the lesson card.">
            <Textarea id="summary" value={l.summary} maxLength={500} onChange={(e) => set('summary', e.target.value)} className="min-h-16" />
          </Field>
          <label className="flex items-center gap-3 text-sm">
            <Switch checked={l.published} onCheckedChange={(c) => set('published', c)} aria-label="Show this lesson to students" />
            {l.published ? 'Visible to students' : 'Hidden from students'}
          </label>
        </Section>

        <Section title="Formulas" description="Shown at the top of the lesson. Formula Match and Formula Memory also use them.">
          <Repeater
            items={l.formulas}
            onChange={(v) => set('formulas', v)}
            make={() => ({ label: '', expr: '' })}
            addLabel="Add formula"
            itemLabel={(i) => `formula ${i + 1}`}
          >
            {(f, update, i) => (
              <div className="grid gap-2 sm:grid-cols-[1fr_2fr]">
                <Input value={f.label} required placeholder="Name, e.g. Product law" aria-label={`Formula ${i + 1} name`} onChange={(e) => update({ ...f, label: e.target.value })} />
                <Input value={f.expr} required placeholder="logₐ(MN) = logₐ M + logₐ N" aria-label={`Formula ${i + 1}`} className="math" onChange={(e) => update({ ...f, expr: e.target.value })} />
              </div>
            )}
          </Repeater>
        </Section>

        <Section title="Explanation" description="One paragraph per box.">
          <StringList items={l.explanation} onChange={(v) => set('explanation', v)} addLabel="Add paragraph" itemLabel="Paragraph" multiline />
        </Section>

        <Section title="Worked examples" description="Students reveal the steps one at a time. Examples with three or more steps also become Equation Puzzle rounds.">
          <Repeater
            items={l.examples}
            onChange={(v) => set('examples', v)}
            make={() => ({ problem: '', steps: [''], answer: '' })}
            addLabel="Add example"
            itemLabel={(i) => `example ${i + 1}`}
            max={10}
          >
            {(ex, update, i) => (
              <>
                <Field label={`Example ${i + 1}: problem`}>
                  <Input value={ex.problem} required aria-label={`Example ${i + 1} problem`} onChange={(e) => update({ ...ex, problem: e.target.value })} />
                </Field>
                <Field label="Steps">
                  <StringList items={ex.steps} onChange={(steps) => update({ ...ex, steps })} addLabel="Add step" itemLabel={`Example ${i + 1} step`} max={12} className="math" />
                </Field>
                <Field label="Answer">
                  <Input value={ex.answer} required aria-label={`Example ${i + 1} answer`} className="math" onChange={(e) => update({ ...ex, answer: e.target.value })} />
                </Field>
              </>
            )}
          </Repeater>
        </Section>

        <Section title="Practice" description="Auto-checked questions at the end of the lesson. Answers are compared ignoring spaces, letter case, “x =”, and $ signs.">
          <Repeater
            items={l.practice}
            onChange={(v) => set('practice', v)}
            make={() => ({ prompt: '', answer: '', hint: '' })}
            addLabel="Add practice question"
            itemLabel={(i) => `practice question ${i + 1}`}
            max={10}
          >
            {(p, update, i) => (
              <div className="grid gap-2 sm:grid-cols-3">
                <Input value={p.prompt} required placeholder="Question" aria-label={`Practice ${i + 1} question`} onChange={(e) => update({ ...p, prompt: e.target.value })} />
                <Input value={p.answer} required placeholder="Answer" aria-label={`Practice ${i + 1} answer`} className="math" onChange={(e) => update({ ...p, answer: e.target.value })} />
                <Input value={p.hint} placeholder="Hint (optional)" aria-label={`Practice ${i + 1} hint`} onChange={(e) => update({ ...p, hint: e.target.value })} />
              </div>
            )}
          </Repeater>
        </Section>

        <Section title="Keywords" description="Used by topic search and to score whether an uploaded PDF fits this lesson. Separate them with commas.">
          <Textarea value={keywords} onChange={(e) => setKeywords(e.target.value)} aria-label="Keywords" className="min-h-16" />
        </Section>

        <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t bg-background/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
          <Button type="submit" disabled={busy}>
            {busy ? 'Saving…' : isNew ? 'Create lesson' : 'Save changes'}
          </Button>
          <Button asChild variant="outline">
            <Link to="/app/admin/lessons">Cancel</Link>
          </Button>
          {!isNew && (
            <div className="ml-auto">
              <ConfirmDelete
                what={`“${existing.title}”`}
                detail={`This also deletes its ${questionCount} quiz question${questionCount === 1 ? '' : 's'}. Lessons with uploaded PDFs can’t be deleted; hide them instead.`}
                busy={busy}
                onConfirm={async () => {
                  const ok = await run(() => deleteLesson({ data: { id: existing.id } }), 'Lesson deleted')
                  if (ok) await navigate({ to: '/app/admin/lessons' })
                }}
              />
            </div>
          )}
        </div>
      </form>
    </>
  )
}
