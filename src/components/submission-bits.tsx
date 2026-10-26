import { FileText } from 'lucide-react'

import { useContent } from '@/lib/content'
import { bandCopy, type RelevanceBand } from '@/lib/relevance'
import { statusCopy, type Submission, type SubmissionStatus } from '@/lib/submissions'
import { cn } from '@/lib/utils'

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  const s = statusCopy[status]
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', s.tone)}>{s.label}</span>
}

const bandTone: Record<RelevanceBand, string> = {
  relevant: 'text-success',
  review: 'text-chart-2',
  unrelated: 'text-destructive',
}

export function ScoreMeter({ score, band }: { score: number | null; band: RelevanceBand | null }) {
  if (score === null || band === null) {
    return <span className="text-xs font-medium text-muted-foreground">No score — unreadable</span>
  }
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className={cn('h-full rounded-full bg-current', bandTone[band])} style={{ width: `${score}%` }} />
      </div>
      <span className={cn('math text-xs font-semibold', bandTone[band])}>{score}%</span>
      <span className="text-xs text-muted-foreground">{bandCopy[band].label}</span>
    </div>
  )
}

export function SubmissionRow({ s, action }: { s: Submission; action?: React.ReactNode }) {
  const lesson = useContent().getLesson(s.lessonId)
  return (
    <div className="flex flex-wrap items-center gap-4 py-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive">
        <FileText className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{s.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {lesson?.title ?? 'Hidden lesson'} · {s.fileName} · {(s.sizeKb / 1024).toFixed(1)} MB
        </p>
      </div>
      <ScoreMeter score={s.score} band={s.band} />
      <StatusBadge status={s.status} />
      {action}
    </div>
  )
}
