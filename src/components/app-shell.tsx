import { useState } from 'react'
import { Link, useNavigate, useRouter, useRouterState } from '@tanstack/react-router'
import {
  BookOpen,
  ClipboardCheck,
  ExternalLink,
  FolderOpen,
  Gamepad2,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Share2,
  Sigma,
  Trophy,
  UserRound,
  Users,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { signOut } from '@/lib/auth.functions'
import { useContent } from '@/lib/content'
import { forgetViewer } from '@/lib/viewer'
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

// The admin manages the site rather than studying, so it gets its own menu.
const adminNav = [
  {
    items: [
      { to: '/app/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
      { to: '/app/admin/review', label: 'Review uploads', icon: ClipboardCheck },
      { to: '/app/admin/users', label: 'Users', icon: Users },
    ],
  },
  {
    heading: 'Content',
    items: [
      { to: '/app/admin/lessons', label: 'Topics & lessons', icon: BookOpen },
      { to: '/app/admin/quizzes', label: 'Quizzes', icon: Trophy },
      { to: '/app/admin/games', label: 'Games', icon: Gamepad2 },
    ],
  },
  {
    items: [
      { to: '/app/shared', label: 'Shared Materials', icon: Share2 },
      { to: '/app/profile', label: 'Profile', icon: UserRound },
    ],
  },
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

const linkClass =
  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground motion-reduce:transition-none'
const activeClass = 'bg-sidebar-accent text-sidebar-accent-foreground [&>svg]:text-sidebar-primary'

function AdminNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Admin">
      {adminNav.map((group, g) => (
        <div key={g} className={cn('flex flex-col gap-1', g > 0 && 'mt-3 border-t border-sidebar-border pt-3')}>
          {'heading' in group && <p className="px-3 pb-1 text-xs font-semibold tracking-wide text-sidebar-foreground/60 uppercase">{group.heading}</p>}
          {group.items.map((item) => (
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
        </div>
      ))}
      <Link to="/app/learn" onClick={onNavigate} className={cn(linkClass, 'mt-3 text-xs')}>
        <ExternalLink className="size-3.5" />
        View as student
      </Link>
    </nav>
  )
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
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
    </nav>
  )
}

function SidebarBody({ viewer, onNavigate }: { viewer: Viewer; onNavigate?: () => void }) {
  const router = useRouter()
  async function logOut() {
    onNavigate?.()
    await signOut()
    forgetViewer()
    await router.invalidate()
    await router.navigate({ to: '/login' })
  }
  return (
    <div className="flex h-full flex-col gap-8 p-4">
      <Link to="/" className="px-2 pt-2 text-sidebar-foreground" onClick={onNavigate}>
        <Logo />
      </Link>
      {viewer.role === 'admin' ? <AdminNavLinks onNavigate={onNavigate} /> : <NavLinks onNavigate={onNavigate} />}
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
  const { lessons, getTopic } = useContent()
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

// Thin bar across the top while the next page's data loads, so a click never looks ignored.
function NavProgress() {
  const pending = useRouterState({ select: (s) => s.status === 'pending' })
  if (!pending) return null
  return (
    <div className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-primary/20" role="status">
      <div className="h-full w-1/3 animate-nav-progress bg-primary motion-reduce:w-full motion-reduce:animate-none" />
      <span className="sr-only">Loading page…</span>
    </div>
  )
}

export function AppShell({ viewer, children }: { viewer: Viewer; children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[16rem_1fr]">
      <NavProgress />
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
