// Building blocks for the admin content editors.
import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { forgetContent } from '@/lib/content'
import { setPublished } from '@/lib/content.functions'
import { cn } from '@/lib/utils'

// Runs a content change, then refreshes cached content everywhere in this tab.
export function useContentAction() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true)
    try {
      await action()
      forgetContent()
      await router.invalidate()
      toast.success(success)
      return true
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save the change.')
      return false
    } finally {
      setBusy(false)
    }
  }
  return { busy, run }
}

export function PublishedSwitch({
  table,
  id,
  published,
  label,
}: {
  table: 'lessons' | 'questions' | 'error_items'
  id: string
  published: boolean
  label: string
}) {
  const { busy, run } = useContentAction()
  return (
    <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
      <Switch
        checked={published}
        disabled={busy}
        aria-label={`Show ${label} to students`}
        onCheckedChange={(c) => run(() => setPublished({ data: { table, id, published: c } }), c ? 'Now visible to students' : 'Hidden from students')}
      />
      {published ? 'Visible' : 'Hidden'}
    </label>
  )
}

// An editable list. Each row gets move up/down and remove controls.
export function Repeater<T>({
  items,
  onChange,
  make,
  addLabel,
  itemLabel,
  max = 20,
  min = 0,
  children,
}: {
  items: T[]
  onChange: (items: T[]) => void
  make: () => T
  addLabel: string
  itemLabel: (i: number) => string
  max?: number
  min?: number
  children: (item: T, update: (next: T) => void, i: number) => React.ReactNode
}) {
  const set = (i: number, next: T) => onChange(items.map((x, k) => (k === i ? next : x)))
  const move = (i: number, d: -1 | 1) => {
    const next = [...items]
    ;[next[i], next[i + d]] = [next[i + d], next[i]]
    onChange(next)
  }
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 rounded-xl border bg-background p-3">
          <div className="min-w-0 flex-1 space-y-2">{children(item, (next) => set(i, next), i)}</div>
          <div className="flex shrink-0 flex-col gap-1">
            <Button type="button" variant="ghost" size="icon" className="size-7" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${itemLabel(i)} up`}>
              <ArrowUp />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              disabled={i === items.length - 1}
              onClick={() => move(i, 1)}
              aria-label={`Move ${itemLabel(i)} down`}
            >
              <ArrowDown />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 text-destructive hover:text-destructive"
              disabled={items.length <= min}
              onClick={() => onChange(items.filter((_, k) => k !== i))}
              aria-label={`Remove ${itemLabel(i)}`}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      ))}
      {items.length < max && (
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, make()])}>
          <Plus /> {addLabel}
        </Button>
      )}
    </div>
  )
}

// A list of plain strings, as one input (or textarea) per line.
export function StringList({
  items,
  onChange,
  addLabel,
  itemLabel,
  multiline,
  max,
  min,
  className,
}: {
  items: string[]
  onChange: (items: string[]) => void
  addLabel: string
  itemLabel: string
  multiline?: boolean
  max?: number
  min?: number
  className?: string
}) {
  return (
    <Repeater items={items} onChange={onChange} make={() => ''} addLabel={addLabel} itemLabel={(i) => `${itemLabel} ${i + 1}`} max={max} min={min}>
      {(value, update, i) =>
        multiline ? (
          <Textarea value={value} onChange={(e) => update(e.target.value)} aria-label={`${itemLabel} ${i + 1}`} className={cn('min-h-20', className)} />
        ) : (
          <Input value={value} onChange={(e) => update(e.target.value)} aria-label={`${itemLabel} ${i + 1}`} className={className} />
        )
      }
    </Repeater>
  )
}

export function ConfirmDelete({
  what,
  detail,
  onConfirm,
  busy,
}: {
  what: string
  detail?: string
  onConfirm: () => Promise<unknown>
  busy: boolean
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setOpen(true)}>
        <Trash2 /> Delete
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {what}?</DialogTitle>
            <DialogDescription>{detail ?? 'This can’t be undone. To keep it but stop showing it to students, hide it instead.'}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={async () => {
                await onConfirm()
                setOpen(false)
              }}
            >
              <Trash2 /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function Field({ label, htmlFor, hint, children }: { label: string; htmlFor?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}
