import { createFileRoute, Link } from '@tanstack/react-router'
import { toast } from 'sonner'

import { PageHeader } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { currentUser, mySubmissions } from '@/data/fixtures'
import { useProgress } from '@/lib/progress'

export const Route = createFileRoute('/app/profile')({
  head: () => ({ meta: [{ title: 'Profile · MathConnect' }] }),
  component: Profile,
})

function Profile() {
  const { progress } = useProgress()
  const initials = currentUser.name
    .split(' ')
    .map((p) => p[0])
    .join('')
  const stats = [
    { label: 'Quizzes taken', value: Object.values(progress.quizAttempts).reduce((a, b) => a + b, 0) },
    { label: 'Games played', value: Object.keys(progress.gameBest).length },
    { label: 'PDFs approved', value: mySubmissions.filter((s) => s.status === 'approved').length },
  ]

  return (
    <>
      <PageHeader title="Profile" />
      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <section className="rounded-2xl border bg-card p-6 text-center">
          <span className="mx-auto grid size-20 place-items-center rounded-full bg-primary font-display text-2xl font-bold text-highlight">{initials}</span>
          <h2 className="mt-4 font-display text-xl font-bold">{currentUser.name}</h2>
          <p className="text-sm text-muted-foreground">{currentUser.email}</p>
          <span className="mt-3 inline-block rounded-full bg-secondary px-3 py-1 text-xs font-semibold capitalize text-secondary-foreground">{currentUser.role}</span>
          <dl className="mt-6 grid grid-cols-3 gap-2 border-t pt-6">
            {stats.map((s) => (
              <div key={s.label}>
                <dd className="font-display text-2xl font-bold">{s.value}</dd>
                <dt className="text-xs text-muted-foreground">{s.label}</dt>
              </div>
            ))}
          </dl>
        </section>

        <div className="space-y-6">
          <form
            className="rounded-2xl border bg-card p-6"
            onSubmit={(e) => {
              e.preventDefault()
              toast.success('Profile saved')
            }}
          >
            <h2 className="font-semibold">Account details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" defaultValue={currentUser.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={currentUser.email} disabled />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Roles are managed by the admin. Contact them to request teacher access.</p>
            <Button type="submit" className="mt-4">
              Save changes
            </Button>
          </form>

          <section className="rounded-2xl border bg-card p-6">
            <h2 className="font-semibold">Password</h2>
            <p className="mt-1 text-sm text-muted-foreground">We’ll email you a secure link to set a new password.</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link to="/forgot-password">Reset password</Link>
            </Button>
          </section>
        </div>
      </div>
    </>
  )
}
