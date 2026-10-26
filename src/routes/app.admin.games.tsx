import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ExternalLink, Pencil, Plus } from 'lucide-react'

import { ConfirmDelete, Field, PublishedSwitch, Section, StringList, useContentAction } from '@/components/admin-editor'
import { PageHeader } from '@/components/app-shell'
import { games } from '@/components/games'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { Content, ErrorItem, TopicId } from '@/lib/content'
import { deleteErrorItem, getAdminContent, saveErrorItem } from '@/lib/content.functions'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/app/admin/games')({
  head: () => ({ meta: [{ title: 'Games · MathConnect' }] }),
  loader: () => getAdminContent(),
  component: GamesAdmin,
})

// Where each game gets its content, and how many items it needs for one round.
function sourceOf(id: string, c: Content) {
  const formulas = c.lessons.filter((l) => l.published).reduce((n, l) => n + l.formulas.length, 0)
  const puzzles = c.lessons.filter((l) => l.published).reduce((n, l) => n + l.examples.filter((e) => e.steps.length >= 3).length, 0)
  const errors = c.errorItems.filter((e) => e.published).length
  switch (id) {
    case 'formula-match':
    case 'formula-memory':
      return { text: `Uses lesson formulas (${formulas} visible). Needs 6.`, ok: formulas >= 6, edit: 'lessons' as const }
    case 'equation-puzzle':
      return { text: `Uses worked examples with 3+ steps (${puzzles} visible). Needs 4.`, ok: puzzles >= 4, edit: 'lessons' as const }
    case 'find-the-error':
      return { text: `Uses the items below (${errors} visible). Needs 5.`, ok: errors >= 5, edit: null }
    default:
      return { text: 'Generates its own problems. Nothing to edit.', ok: true, edit: null }
  }
}

type Draft = Omit<ErrorItem, 'id'> & { id?: string }
const blank: Draft = { topic: null, problem: '', steps: ['', '', ''], wrong: 0, why: '', published: true }

function ErrorItemDialog({ content, draft, onClose }: { content: Content; draft: Draft | null; onClose: () => void }) {
  const [e, setE] = useState<Draft | null>(draft)
  const { busy, run } = useContentAction()
  if (!e) return null
  // The wrong-step mark follows its step when steps are reordered or removed.
  const setSteps = (steps: string[]) => {
    const edits = steps.length === e.steps.length ? steps.filter((s, i) => s !== e.steps[i]).length : -1
    if (edits >= 0 && edits <= 1) return setE({ ...e, steps })
    const wrong = steps.indexOf(e.steps[e.wrong])
    setE({ ...e, steps, wrong: wrong >= 0 ? wrong : 0 })
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{e.id ? 'Edit Find the Error item' : 'New Find the Error item'}</DialogTitle>
          <DialogDescription>Write a short solution with exactly one broken step, then explain the mistake.</DialogDescription>
        </DialogHeader>
        <form
          id="error-form"
          className="space-y-4"
          onSubmit={async (ev) => {
            ev.preventDefault()
            const ok = await run(() => saveErrorItem({ data: e }), e.id ? 'Item saved' : 'Item added')
            if (ok) onClose()
          }}
        >
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <Field label="Problem" htmlFor="fe-problem">
              <Input id="fe-problem" value={e.problem} required maxLength={300} onChange={(ev) => setE({ ...e, problem: ev.target.value })} />
            </Field>
            <Field label="Topic" htmlFor="fe-topic">
              <Select value={e.topic ?? 'none'} onValueChange={(v) => setE({ ...e, topic: v === 'none' ? null : (v as TopicId) })}>
                <SelectTrigger id="fe-topic" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No topic</SelectItem>
                  {content.topics.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Solution steps</legend>
            <StringList items={e.steps} onChange={setSteps} addLabel="Add step" itemLabel="Step" min={2} max={8} className="math" />
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Which step is wrong?</legend>
            <RadioGroup value={String(e.wrong)} onValueChange={(v) => setE({ ...e, wrong: Number(v) })} className="gap-2">
              {e.steps.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <RadioGroupItem value={String(i)} id={`fe-wrong-${i}`} />
                  <Label htmlFor={`fe-wrong-${i}`} className="math font-normal">
                    {s || <span className="text-muted-foreground italic">Step {i + 1} (empty)</span>}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </fieldset>
          <Field label="Why it’s wrong" htmlFor="fe-why">
            <Textarea id="fe-why" value={e.why} required maxLength={1000} onChange={(ev) => setE({ ...e, why: ev.target.value })} className="min-h-16" />
          </Field>
          <label className="flex items-center gap-3 text-sm">
            <Switch checked={e.published} onCheckedChange={(c) => setE({ ...e, published: c })} aria-label="Show this item to students" />
            {e.published ? 'Visible to students' : 'Hidden from students'}
          </label>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="error-form" disabled={busy}>
            {busy ? 'Saving…' : 'Save item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function GamesAdmin() {
  const content = Route.useLoaderData()
  const [editing, setEditing] = useState<Draft | null>(null)
  const { busy, run } = useContentAction()
  const topicName = (id: TopicId | null) => (id ? (content.topics.find((t) => t.id === id)?.short ?? id) : 'No topic')

  return (
    <>
      <PageHeader title="Games" description="See what each game is built from. Find the Error has its own items; the others reuse lesson content." />
      <div className="space-y-6">
        <Section title="All games">
          <ul className="divide-y rounded-xl border bg-background">
            {games.map((g) => {
              const src = sourceOf(g.id, content)
              return (
                <li key={g.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
                  <g.icon className="size-5 text-chart-1" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{g.name}</p>
                    <p className={cn('text-xs', src.ok ? 'text-muted-foreground' : 'font-medium text-destructive')}>
                      {src.text}
                      {!src.ok && ' Students see “not enough content” until you add more.'}
                    </p>
                  </div>
                  {src.edit === 'lessons' && (
                    <Button asChild size="sm" variant="outline">
                      <Link to="/app/admin/lessons">
                        <Pencil /> Edit lessons
                      </Link>
                    </Button>
                  )}
                  <Button asChild size="sm" variant="ghost">
                    <Link to="/app/games/$gameId" params={{ gameId: g.id }}>
                      <ExternalLink /> Play
                    </Link>
                  </Button>
                </li>
              )
            })}
          </ul>
        </Section>

        <Section title="Find the Error items" description="Each round picks 5 visible items at random.">
          <div>
            <Button onClick={() => setEditing(blank)}>
              <Plus /> New item
            </Button>
          </div>
          {content.errorItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items yet.</p>
          ) : (
            <ul className="space-y-3">
              {content.errorItems.map((e) => (
                <li key={e.id} className={cn('rounded-xl border bg-background p-4', !e.published && 'opacity-70')}>
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">{topicName(e.topic)}</p>
                      <p className="font-medium">{e.problem}</p>
                    </div>
                    <PublishedSwitch table="error_items" id={e.id} published={e.published} label="this item" />
                  </div>
                  <ol className="mt-2 space-y-1 text-sm">
                    {e.steps.map((s, i) => (
                      <li key={i} className={cn('math', i === e.wrong ? 'font-semibold text-destructive' : 'text-muted-foreground')}>
                        {i + 1}. {s}
                        {i === e.wrong && <span className="sr-only"> (the wrong step)</span>}
                      </li>
                    ))}
                  </ol>
                  <p className="mt-2 text-sm">{e.why}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditing(e)}>
                      <Pencil /> Edit
                    </Button>
                    <ConfirmDelete what="this item" busy={busy} onConfirm={() => run(() => deleteErrorItem({ data: { id: e.id } }), 'Item deleted')} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
      <ErrorItemDialog key={editing ? (editing.id ?? 'new') : 'closed'} content={content} draft={editing} onClose={() => setEditing(null)} />
    </>
  )
}
