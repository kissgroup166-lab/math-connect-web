import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Check, Pencil, Plus } from 'lucide-react'

import { ConfirmDelete, Field, PublishedSwitch, Section, StringList, useContentAction } from '@/components/admin-editor'
import { PageHeader } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { quizKeys, type Content, type QuizKey, type QuizQuestion } from '@/lib/content'
import { deleteQuestion, getAdminContent, saveQuestion, saveQuizSettings } from '@/lib/content.functions'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/app/admin/quizzes')({
  head: () => ({ meta: [{ title: 'Quizzes · MathConnect' }] }),
  loader: () => getAdminContent(),
  component: QuizzesAdmin,
})

type Draft = Omit<QuizQuestion, 'id' | 'topic'> & { id?: string }
const blank = (lessonId: string): Draft => ({ lessonId, prompt: '', choices: ['', '', '', ''], answer: 0, explanation: '', published: true })

function LessonSelect({ content, value, onChange, id, all }: { content: Content; value: string; onChange: (v: string) => void; id: string; all?: boolean }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder="Choose a lesson" />
      </SelectTrigger>
      <SelectContent>
        {all && <SelectItem value="all">All lessons</SelectItem>}
        {content.topics.map((t) => (
          <SelectGroup key={t.id}>
            <SelectLabel>{t.name}</SelectLabel>
            {content.lessons
              .filter((l) => l.topic === t.id)
              .map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.title}
                  {!l.published && ' (hidden)'}
                </SelectItem>
              ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}

function QuestionDialog({ content, draft, onClose }: { content: Content; draft: Draft | null; onClose: () => void }) {
  const [q, setQ] = useState<Draft | null>(draft)
  const { busy, run } = useContentAction()
  if (!q) return null
  // The correct-answer mark follows its choice when choices are reordered or removed.
  // Typing into one choice changes a single entry, so the mark stays put.
  const setChoices = (choices: string[]) => {
    const edits = choices.length === q.choices.length ? choices.filter((c, i) => c !== q.choices[i]).length : -1
    if (edits >= 0 && edits <= 1) return setQ({ ...q, choices })
    const answer = choices.indexOf(q.choices[q.answer])
    setQ({ ...q, choices, answer: answer >= 0 ? answer : 0 })
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{q.id ? 'Edit question' : 'New question'}</DialogTitle>
          <DialogDescription>Students see the explanation after they answer.</DialogDescription>
        </DialogHeader>
        <form
          id="question-form"
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault()
            const ok = await run(() => saveQuestion({ data: q }), q.id ? 'Question saved' : 'Question added')
            if (ok) onClose()
          }}
        >
          <Field label="Lesson" htmlFor="q-lesson" hint="The question appears in this lesson’s topic quiz and counts toward its progress.">
            <LessonSelect id="q-lesson" content={content} value={q.lessonId} onChange={(lessonId) => setQ({ ...q, lessonId })} />
          </Field>
          <Field label="Question" htmlFor="q-prompt">
            <Textarea id="q-prompt" value={q.prompt} required maxLength={500} onChange={(e) => setQ({ ...q, prompt: e.target.value })} className="min-h-16" />
          </Field>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Choices</legend>
            <StringList items={q.choices} onChange={setChoices} addLabel="Add choice" itemLabel="Choice" min={2} max={6} className="math" />
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Correct answer</legend>
            <RadioGroup value={String(q.answer)} onValueChange={(v) => setQ({ ...q, answer: Number(v) })} className="gap-2">
              {q.choices.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <RadioGroupItem value={String(i)} id={`q-answer-${i}`} />
                  <Label htmlFor={`q-answer-${i}`} className="math font-normal">
                    {c || <span className="text-muted-foreground italic">Choice {i + 1} (empty)</span>}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </fieldset>
          <Field label="Explanation" htmlFor="q-explanation">
            <Textarea id="q-explanation" value={q.explanation} maxLength={1000} onChange={(e) => setQ({ ...q, explanation: e.target.value })} className="min-h-16" />
          </Field>
          <label className="flex items-center gap-3 text-sm">
            <Switch checked={q.published} onCheckedChange={(c) => setQ({ ...q, published: c })} aria-label="Show this question to students" />
            {q.published ? 'Visible to students' : 'Hidden from students'}
          </label>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="question-form" disabled={busy || !q.lessonId}>
            {busy ? 'Saving…' : 'Save question'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Per-quiz ordering. A run already in progress keeps its order until the student starts over.
function QuizOrderSettings({ content }: { content: Content }) {
  const { busy, run } = useContentAction()
  const nameOf = (k: QuizKey) => (k === 'all' ? 'Mixed review' : (content.topics.find((t) => t.id === k)?.name ?? k))
  return (
    <Section title="Question order" description="Choose per quiz whether questions and answer choices appear in random order. Students who are partway through keep their current order until they start over.">
      <div className="divide-y rounded-xl border bg-background">
        {quizKeys.map((k) => {
          const s = content.quizSettings[k]
          const set = (patch: Partial<typeof s>) => run(() => saveQuizSettings({ data: { quiz: k, ...s, ...patch } }), `${nameOf(k)} updated`)
          return (
            <div key={k} className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4">
              <p className="min-w-40 flex-1 font-medium">{nameOf(k)}</p>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={s.shuffleQuestions} disabled={busy} onCheckedChange={(c) => set({ shuffleQuestions: c })} aria-label={`Random question order for ${nameOf(k)}`} />
                Random question order
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={s.shuffleChoices} disabled={busy} onCheckedChange={(c) => set({ shuffleChoices: c })} aria-label={`Shuffle answer choices for ${nameOf(k)}`} />
                Shuffle answer choices
              </label>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

function QuizzesAdmin() {
  const content = Route.useLoaderData()
  const [lessonFilter, setLessonFilter] = useState('all')
  const [editing, setEditing] = useState<Draft | null>(null)
  const { busy, run } = useContentAction()
  const lessonTitle = (id: string) => content.lessons.find((l) => l.id === id)?.title ?? id
  const shown = content.questions.filter((q) => lessonFilter === 'all' || q.lessonId === lessonFilter)
  const firstLesson = lessonFilter !== 'all' ? lessonFilter : (content.lessons[0]?.id ?? '')

  return (
    <>
      <PageHeader
        title="Quizzes"
        description="Each topic quiz uses the visible questions of its lessons. The mixed review uses all of them."
        action={
          <Button onClick={() => setEditing(blank(firstLesson))} disabled={content.lessons.length === 0}>
            <Plus /> New question
          </Button>
        }
      />
      <div className="mb-8">
        <QuizOrderSettings content={content} />
      </div>
      <h2 className="mb-3 font-display text-lg font-bold">Questions</h2>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-full max-w-xs">
          <LessonSelect id="filter" content={content} value={lessonFilter} onChange={setLessonFilter} all />
        </div>
        <p className="text-sm text-muted-foreground">
          {shown.length} question{shown.length === 1 ? '' : 's'}
        </p>
      </div>
      {shown.length === 0 ? (
        <p className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">No questions here yet.</p>
      ) : (
        <ul className="space-y-3">
          {shown.map((q, n) => (
            <li key={q.id} className={cn('rounded-2xl border bg-card p-5', !q.published && 'opacity-70')}>
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">
                    {n + 1}. {lessonTitle(q.lessonId)}
                  </p>
                  <p className="mt-1 font-medium">{q.prompt}</p>
                </div>
                <PublishedSwitch table="questions" id={q.id} published={q.published} label="this question" />
              </div>
              <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                {q.choices.map((c, i) => (
                  <li
                    key={i}
                    className={cn(
                      'math flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm',
                      i === q.answer ? 'border-success/40 bg-success/10 font-semibold text-success' : 'text-muted-foreground',
                    )}
                  >
                    {i === q.answer && <Check className="size-3.5 shrink-0" aria-label="Correct answer" />}
                    {c}
                  </li>
                ))}
              </ul>
              {q.explanation && <p className="mt-3 text-sm text-muted-foreground">{q.explanation}</p>}
              <div className="mt-3 flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(q)}>
                  <Pencil /> Edit
                </Button>
                <ConfirmDelete what="this question" busy={busy} onConfirm={() => run(() => deleteQuestion({ data: { id: q.id } }), 'Question deleted')} />
              </div>
            </li>
          ))}
        </ul>
      )}
      <QuestionDialog key={editing ? (editing.id ?? 'new') : 'closed'} content={content} draft={editing} onClose={() => setEditing(null)} />
    </>
  )
}
