import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, BookOpen, ClipboardCheck, EyeOff, Gamepad2, Trophy, Users } from 'lucide-react'

import { PageHeader } from '@/components/app-shell'
import { getAdminContent } from '@/lib/content.functions'
import { inReview } from '@/lib/submissions'
import { listAllSubmissions } from '@/lib/submissions.functions'
import { listUsers } from '@/lib/users.functions'

export const Route = createFileRoute('/app/admin/')({
  head: () => ({ meta: [{ title: 'Admin overview · MathConnect' }] }),
  loader: async () => {
    const [submissions, users, content] = await Promise.all([listAllSubmissions(), listUsers(), getAdminContent()])
    return { submissions, users, content }
  },
  component: Overview,
})

function Overview() {
  const { viewer } = Route.useRouteContext()
  const { submissions, users, content } = Route.useLoaderData()
  const pending = submissions.filter(inReview).length
  const teachersToVerify = users.filter((u) => u.role === 'teacher' && !u.canPublish).length
  const hidden = [...content.lessons, ...content.questions, ...content.errorItems].filter((x) => !x.published).length

  const cards = [
    {
      to: '/app/admin/review' as const,
      icon: ClipboardCheck,
      label: 'Uploads waiting for review',
      value: pending,
      note: pending ? 'Review them now' : 'All caught up',
    },
    {
      to: '/app/admin/users' as const,
      icon: Users,
      label: 'Users',
      value: users.length,
      note: teachersToVerify ? `${teachersToVerify} teacher${teachersToVerify === 1 ? '' : 's'} to verify` : 'No teachers waiting',
    },
    {
      to: '/app/admin/lessons' as const,
      icon: BookOpen,
      label: 'Lessons',
      value: content.lessons.length,
      note: `${content.topics.length} topics`,
    },
    {
      to: '/app/admin/quizzes' as const,
      icon: Trophy,
      label: 'Quiz questions',
      value: content.questions.length,
      note: 'Add, edit, or hide questions',
    },
    {
      to: '/app/admin/games' as const,
      icon: Gamepad2,
      label: 'Find the Error items',
      value: content.errorItems.length,
      note: 'Other games use lesson content',
    },
  ]

  return (
    <>
      <PageHeader title={`Welcome, ${viewer.name}`} description="Manage uploads, users, and everything students learn from." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="group flex flex-col rounded-2xl border bg-card p-6 transition-shadow hover:shadow-md motion-reduce:transition-none"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{c.label}</p>
              <c.icon className="size-4 text-chart-1" />
            </div>
            <p className="mt-3 font-display text-3xl font-bold">{c.value}</p>
            <p className="mt-auto flex items-center gap-1 pt-3 text-xs font-medium text-primary">
              {c.note} <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
            </p>
          </Link>
        ))}
      </div>
      {hidden > 0 && (
        <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <EyeOff className="size-4" /> {hidden} hidden item{hidden === 1 ? ' is' : 's are'} not shown to students.
        </p>
      )}
    </>
  )
}
