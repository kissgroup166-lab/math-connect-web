import { useState } from 'react'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { ArrowLeft, Check, FileText, Lightbulb, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getLesson, useContent, type PracticeItem, type WorkedExample } from '@/lib/content'
import { fileUrl } from '@/lib/submissions'
import { listApproved } from '@/lib/submissions.functions'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/app/learn/$lessonId')({
  loader: async ({ params, context }) => {
    const lesson = getLesson(context.content, params.lessonId)
    if (!lesson) throw notFound()
    return { lesson, materials: await listApproved({ data: { lessonId: lesson.id } }) }
  },
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.lesson.title ?? 'Lesson'} · MathConnect` }] }),
  component: LessonPage,
})

function Example({ ex, n }: { ex: WorkedExample; n: number }) {
  const [shown, setShown] = useState(0)
  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-xs font-semibold text-muted-foreground uppercase">Example {n}</p>
      <p className="mt-1 font-medium">{ex.problem}</p>
      <ol className="math mt-3 space-y-1.5 text-sm">
        {ex.steps.slice(0, shown).map((s, i) => (
          <li key={i} className="rounded-md bg-muted px-3 py-1.5">
            {s}
          </li>
        ))}
        {shown > ex.steps.length - 1 && <li className="rounded-md bg-success/15 px-3 py-1.5 font-semibold text-success">∴ {ex.answer}</li>}
      </ol>
      {shown <= ex.steps.length - 1 ? (
        <Button size="sm" variant="outline" className="mt-3" onClick={() => setShown((s) => s + 1)}>
          {shown === 0 ? 'Show first step' : 'Next step'}
        </Button>
      ) : (
        <Button size="sm" variant="ghost" className="mt-3" onClick={() => setShown(0)}>
          Hide solution
        </Button>
      )}
    </div>
  )
}

const clean = (s: string) => s.toLowerCase().replace(/\s+|x\s*=\s*|\$/g, '').replace(/[−–]/g, '-')

function Practice({ item, n }: { item: PracticeItem; n: number }) {
  const [value, setValue] = useState('')
  const [result, setResult] = useState<'right' | 'wrong' | null>(null)
  const [hint, setHint] = useState(false)
  return (
    <form
      className="rounded-xl border bg-card p-5"
      onSubmit={(e) => {
        e.preventDefault()
        setResult(clean(value) === clean(item.answer) ? 'right' : 'wrong')
      }}
    >
      <label htmlFor={`p-${n}`} className="font-medium">
        {n}. {item.prompt}
      </label>
      <div className="mt-3 flex gap-2">
        <Input id={`p-${n}`} value={value} onChange={(e) => { setValue(e.target.value); setResult(null) }} className="math" placeholder="Your answer" />
        <Button type="submit" disabled={!value.trim()}>
          Check
        </Button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm" aria-live="polite">
        {result === 'right' && (
          <span className="flex items-center gap-1 font-medium text-success">
            <Check className="size-4" /> Correct
          </span>
        )}
        {result === 'wrong' && (
          <span className="flex items-center gap-1 font-medium text-destructive">
            <X className="size-4" /> Not quite. Expected <span className="math">{item.answer}</span>
          </span>
        )}
        {!hint ? (
          <button type="button" className="flex items-center gap-1 text-muted-foreground hover:text-foreground" onClick={() => setHint(true)}>
            <Lightbulb className="size-3.5" /> Hint
          </button>
        ) : (
          <span className="text-muted-foreground">💡 {item.hint}</span>
        )}
      </div>
    </form>
  )
}

function LessonPage() {
  const { lesson, materials } = Route.useLoaderData()
  const { lessons, getTopic } = useContent()
  const topic = getTopic(lesson.topic)
  const idx = lessons.findIndex((l) => l.id === lesson.id)
  const next = lessons[idx + 1]

  return (
    <article key={lesson.id}>
      <Link to="/app/learn" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All lessons
      </Link>
      <p className="text-sm font-semibold text-chart-1">{topic.name}</p>
      <h1 className="mt-1 font-display text-4xl font-bold tracking-tight">{lesson.title}</h1>
      <p className="mt-2 max-w-reading text-lg text-muted-foreground">{lesson.summary}</p>

      <section className="graph-paper mt-8 rounded-2xl border p-6" aria-labelledby="formulas">
        <h2 id="formulas" className="font-semibold">Key formulas</h2>
        <dl className="mt-4 grid gap-3 md:grid-cols-2">
          {lesson.formulas.map((f) => (
            <div key={f.label} className="rounded-xl bg-card p-4 shadow-sm">
              <dt className="text-xs text-muted-foreground">{f.label}</dt>
              <dd className="math mt-1 text-base font-semibold">{f.expr}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-10">
          <section>
            <h2 className="font-display text-xl font-bold">Explanation</h2>
            <div className="mt-3 max-w-reading space-y-3 leading-relaxed">
              {lesson.explanation.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="font-display text-xl font-bold">Worked examples</h2>
            {lesson.examples.map((ex, i) => (
              <Example key={i} ex={ex} n={i + 1} />
            ))}
          </section>
          <section className="space-y-4">
            <h2 className="font-display text-xl font-bold">Practice</h2>
            {lesson.practice.map((p, i) => (
              <Practice key={i} item={p} n={i + 1} />
            ))}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border bg-card p-5">
            <h2 className="font-semibold">Shared materials</h2>
            {materials.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No approved PDFs for this lesson yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {materials.map((m) => (
                  <li key={m.id} className="flex items-start gap-2 text-sm">
                    <FileText className="mt-0.5 size-4 shrink-0 text-destructive" />
                    <span>
                      <a href={fileUrl(m.id)} target="_blank" rel="noreferrer" className="hover:underline">
                        {m.title}
                      </a>
                      <span className="block text-xs text-muted-foreground">by {m.ownerName}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="outline" size="sm" className="mt-4 w-full">
              <Link to="/app/materials">Upload a PDF for this lesson</Link>
            </Button>
          </div>
          <div className="rounded-2xl border bg-card p-5">
            <h2 className="font-semibold">Test yourself</h2>
            <p className="mt-1 text-sm text-muted-foreground">Take the {topic.short} quiz.</p>
            <Button asChild size="sm" className="mt-4 w-full">
              <Link to="/app/quizzes" search={{ topic: topic.id }}>
                Start quiz
              </Link>
            </Button>
          </div>
          {next && (
            <Link
              to="/app/learn/$lessonId"
              params={{ lessonId: next.id }}
              className={cn('block rounded-2xl border bg-primary p-5 text-primary-foreground hover:bg-primary/90')}
            >
              <span className="text-xs opacity-80">Next lesson</span>
              <span className="mt-1 block font-semibold">{next.title} →</span>
            </Link>
          )}
        </aside>
      </div>
    </article>
  )
}
