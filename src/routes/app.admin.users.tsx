import { createFileRoute, useRouter } from '@tanstack/react-router'
import { ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/app-shell'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { AppUser } from '@/lib/submissions'
import { listUsers, updateUser } from '@/lib/users.functions'

export const Route = createFileRoute('/app/admin/users')({
  head: () => ({ meta: [{ title: 'Users · MathConnect' }] }),
  loader: () => listUsers(),
  component: UsersPage,
})

function UsersPanel({ list }: { list: AppUser[] }) {
  const router = useRouter()
  async function patch(u: AppUser, p: Partial<Pick<AppUser, 'role' | 'canPublish'>>) {
    if (u.role === 'admin') return
    const role = p.role === 'teacher' || (p.role === undefined && u.role === 'teacher') ? 'teacher' : 'student'
    try {
      await updateUser({
        data: { id: u.id, role, canPublish: p.canPublish ?? u.canPublish },
      })
      await router.invalidate()
      toast.success(`Updated ${u.name}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update this user.')
    }
  }

  return (
    <div className="rounded-2xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Verified teacher</TableHead>
            <TableHead className="text-right">Uploads</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((u) => (
            <TableRow key={u.id}>
              <TableCell>
                <p className="font-medium">{u.name}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </TableCell>
              <TableCell>
                {u.role === 'admin' ? (
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    <ShieldCheck className="size-4" /> Admin (owner)
                  </span>
                ) : (
                  <Select
                    value={u.role}
                    onValueChange={(v) =>
                      patch(u, {
                        role: v as AppUser['role'],
                        canPublish: false,
                      })
                    }
                  >
                    <SelectTrigger size="sm" className="w-32" aria-label={`Role for ${u.name}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </TableCell>
              <TableCell>
                {u.role === 'teacher' ? (
                  <Switch
                    checked={!!u.canPublish}
                    onCheckedChange={(c) => patch(u, { canPublish: c })}
                    aria-label={`Teacher permissions for ${u.name}`}
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="math text-right">{u.uploads}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="border-t p-4 text-xs text-muted-foreground">
        The admin role can’t be assigned from here and belongs only to the site owner. Verified teachers’ PDFs still go through admin approval.
      </p>
    </div>
  )
}

function UsersPage() {
  const users = Route.useLoaderData()
  return (
    <>
      <PageHeader title="Users" description="Change roles between student and teacher, and verify teachers." />
      <UsersPanel list={users} />
    </>
  )
}
