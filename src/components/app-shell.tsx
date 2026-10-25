import { useState } from 'react'
import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { BookOpen, FolderOpen, Gamepad2, Home, LogOut, Menu, Search, ShieldCheck, Share2, Sigma, Trophy, UserRound } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { getTopic, lessons } from '@/data/lessons'
import { signOut } from '@/lib/auth.functions'
import type { Viewer } from '@/lib/submissions'
import { cn } from '@/lib/utils'

const nav = [
  { to: '/app', label: 'Home', icon: Home, exact: true },
  { to: '/app/learn', label: 'Learn', icon: BookOpen },
  { to: '/app/quizzes', label: 'Quizzes', icon: Trophy },
  { to: '/app/games', label: 'Games', icon: Gamepad2 },
  { to: '/app/materials', label: 'My Materials', icon: FolderOpen },
  { to: '/app/shared', label: 'Shared Materials', icon: Share2 },
  { to: '/app/profile', label: 'Profile', icon: UserRound },
] as const

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2 font-display text-lg font-bold tracking-tight', className)}>
      <span className="grid size-8 place-items-center rounded-lg border-2 border-primary bg-highlight text-primary shadow-[2px_2px_0_0_var(--primary)]">
        <Sigma className="size-5" strokeWidth={2.5} />
      </span>
      MathConnect
    </span>
  )
}

function NavLinks({ onNavigate, isAdmin }: { onNavigate?: () => void; isAdmin: boolean }) {
  const linkClass =
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground motion-reduce:transition-none'
  const activeClass = 'bg-sidebar-accent text-sidebar-accent-foreground [&>svg]:text-sidebar-primary'
  return (
    <nav className="flex flex-col gap-1" aria-label="Dashboard">
      {nav.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          activeOptions={{ exact: 'exact' in item }}
          className={linkClass}
          activeProps={{ className: activeClass }}
        >
          <item.icon className="size-4" />
          {item.label}
        </Link>
      ))}
      {isAdmin && (
        <>
          <div className="my-3 border-t border-sidebar-border" />
          <Link to="/app/admin" onClick={onNavigate} className={linkClass} activeProps={{ className: activeClass }}>
            <ShieldCheck className="size-4" />
            Admin
          </Link>
        </>
      )}
    </nav>
  )
}

function SidebarBody({ viewer, onNavigate }: { viewer: Viewer; onNavigate?: () => void }) {
  const router = useRouter()
  async function logOut() {
    onNavigate?.()
    await signOut()
    await router.invalidate()
    await router.navigate({ to: '/login' })
  }
  return (
    <div className="flex h-full flex-col gap-8 p-4">
      <Link to="/" className="px-2 pt-2 text-sidebar-foreground" onClick={onNavigate}>
        <Logo />
      </Link>
      <NavLinks onNavigate={onNavigate} isAdmin={viewer.role === 'admin'} />
      <div className="mt-auto rounded-xl bg-sidebar-accent p-3 text-sm">
        <p className="font-semibold text-sidebar-accent-foreground">{viewer.name}</p>
        <p className="text-xs capitalize text-sidebar-foreground/70">{viewer.role}</p>
        <button
          type="button"
          onClick={logOut}
          className="mt-3 flex items-center gap-2 text-xs text-sidebar-foreground/80 hover:text-sidebar-primary"
        >
          <LogOut className="size-3.5" /> Log out
        </button>
      </div>
    </div>
  )
}

function TopicSearch() {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const term = q.trim().toLowerCase()
  const results = term
    ? lessons
        .filter(
          (l) =>
            l.title.toLowerCase().includes(term) ||
            getTopic(l.topic).name.toLowerCase().includes(term) ||
            l.keywords.some((k) => k.toLowerCase().includes(term)),
        )
        .slice(0, 6)
    : []

  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results[0]) {
            navigate({
              to: '/app/learn/$lessonId',
              params: { lessonId: results[0].id },
            })
            setQ('')
            setOpen(false)
          }
        }}
        placeholder="Search topics — try “half-angle” or “ln”"
        aria-label="Search topics"
        className="h-10 bg-card pl-9"
      />
      {open && term && (
        <div className="absolute top-full z-30 mt-2 w-full overflow-hidden rounded-xl border bg-popover shadow-lg">
          {results.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No lessons match “{q}”.</p>
          ) : (
            <ul>
              {results.map((l) => (
                <li key={l.id}>
                  <Link
                    to="/app/learn/$lessonId"
                    params={{ lessonId: l.id }}
                    onClick={() => setQ('')}
                    className="flex flex-col px-4 py-2.5 hover:bg-muted"
                  >
                    <span className="text-sm font-medium">{l.title}</span>
                    <span className="text-xs text-muted-foreground">{getTopic(l.topic).name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export function AppShell({ viewer, children }: { viewer: Viewer; children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-screen bg-sidebar lg:block">
        <SidebarBody viewer={viewer} />
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur sm:px-6">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 border-0 bg-sidebar p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
                <SheetDescription>Dashboard sections</SheetDescription>
              </SheetHeader>
              <SidebarBody viewer={viewer} onNavigate={() => setMenuOpen(false)} />
            </SheetContent>
          </Sheet>
          <TopicSearch />
        </header>
        <main className="mx-auto w-full max-w-content px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  )
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-reading text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}
