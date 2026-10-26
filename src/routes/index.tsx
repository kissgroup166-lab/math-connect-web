import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BadgeCheck,
  FileSearch,
  Gamepad2,
  ShieldCheck,
  Trophy,
} from 'lucide-react'

import { Logo } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { useContent } from '@/lib/content'

export const Route = createFileRoute('/')({
  component: Landing,
})

const features = [
  {
    icon: FileSearch,
    title: 'Share PDFs that actually fit the lesson',
    body: 'Every upload is checked against its lesson’s formulas and keywords, gets a relevance score, and waits for admin approval before anyone else sees it.',
  },
  {
    icon: Trophy,
    title: 'Quiz questions with explanations',
    body: 'Instant feedback, retries, and saved best scores for each topic.',
  },
  {
    icon: Gamepad2,
    title: 'Five formula games',
    body: 'Formula Match, Equation Puzzle, Math Challenge, Find the Error, and Formula Memory.',
  },
  {
    icon: ShieldCheck,
    title: 'Roles that keep work private',
    body: 'Students and teachers keep their own uploads private, and only the admin can approve shared materials.',
  },
]

const floatingEquations = [
  {
    text: 'e^(iπ) + 1 = 0',
    className: 'top-6 left-[4%] -rotate-6 text-xl text-highlight/35',
  },
  {
    text: 'tan θ = sin θ / cos θ',
    className:
      'top-[42%] left-[46%] rotate-3 text-sm text-primary-foreground/20 hidden lg:block',
  },
  {
    text: 'y = a·bˣ',
    className: 'bottom-8 left-[8%] rotate-6 text-2xl text-highlight/30',
  },
  {
    text: 'ln(eˣ) = x',
    className: 'top-10 right-[6%] rotate-12 text-lg text-primary-foreground/20',
  },
  {
    text: 'log₁₀ 1000 = 3',
    className:
      'bottom-6 right-[30%] -rotate-3 text-base text-highlight/30 hidden md:block',
  },
  {
    text: '1 + tan²θ = sec²θ',
    className:
      'bottom-[38%] left-[2%] -rotate-12 text-sm text-primary-foreground/15 hidden xl:block',
  },
  {
    text: 'π',
    className:
      'top-[18%] left-[38%] text-6xl text-highlight/20 hidden md:block',
  },
  {
    text: '∑',
    className: 'bottom-[12%] right-[4%] text-7xl text-primary-foreground/10',
  },
]

function Landing() {
  const { lessons, topics } = useContent()
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-content items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link to="/signup">Create account</Link>
          </Button>
        </div>
      </header>

      <section className="graph-paper-light relative overflow-hidden border-y-4 border-highlight bg-primary text-primary-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 select-none"
        >
          {floatingEquations.map((e) => (
            <span
              key={e.text}
              className={`math absolute font-semibold whitespace-nowrap ${e.className}`}
            >
              {e.text}
            </span>
          ))}
        </div>

        <div className="relative mx-auto grid max-w-content items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border-2 border-highlight bg-highlight/15 px-3 py-1 text-xs font-semibold text-highlight">
              <BadgeCheck className="size-3.5" /> {lessons.length} lessons · 3
              focused topics · 100% free
            </p>
            <h1 className="font-display leading-[0.95] font-extrabold tracking-tight">
              <span className="block text-6xl md:text-7xl">MathConnect</span>
              <span className="mt-4 inline-block -rotate-2 rounded-xl border-2 border-primary-foreground bg-highlight px-4 py-1 text-4xl text-primary shadow-[5px_5px_0_0_var(--primary-foreground)] md:text-5xl">
                Learn for free
              </span>
            </h1>
            <p className="mt-8 max-w-reading text-lg text-primary-foreground/85">
              Study trigonometric identities, exponential functions, and
              logarithmic functions with worked lessons, quizzes, games, and a
              library of reviewed PDFs shared by students and teachers. No fees,
              ever.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="border-2 border-primary-foreground bg-highlight text-primary hover:bg-highlight/90"
                asChild
              >
                <Link to="/signup">
                  Start learning free <ArrowRight />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-highlight bg-transparent text-primary-foreground hover:bg-highlight/15 hover:text-primary-foreground"
                asChild
              >
                <Link to="/app/learn">Browse lessons</Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div
              className="absolute -inset-3 rotate-2 rounded-3xl border-2 border-dashed border-highlight"
              aria-hidden
            />
            <div className="relative space-y-3 rounded-2xl border-2 border-highlight bg-card p-6 text-card-foreground shadow-[8px_8px_0_0_var(--highlight)]">
              <p className="flex items-center gap-2 font-display text-sm font-bold text-primary">
                <span className="size-2.5 rounded-full bg-highlight ring-2 ring-primary" />{' '}
                Formula sheet
              </p>
              {[
                'sin²θ + cos²θ = 1',
                'sin 2θ = 2 sin θ cos θ',
                'A = Peʳᵗ',
                'log_b(MN) = log_b M + log_b N',
                'log_b x = ln x / ln b',
              ].map((f, i) => (
                <div
                  key={f}
                  className="math flex items-center justify-between rounded-lg border-2 border-primary/20 border-l-primary bg-secondary px-4 py-3 text-sm"
                  style={{ marginLeft: `${(i % 3) * 12}px` }}
                >
                  {f}
                  <span className="rounded bg-highlight px-1.5 text-xs font-bold text-primary">
                    #{i + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-content px-4 py-16 sm:px-6">
        <h2 className="font-display text-3xl font-bold">
          Three topics,{' '}
          <span className="underline decoration-highlight decoration-[6px] underline-offset-[6px]">
            nothing else
          </span>
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {topics.map((t, i) => (
            <Link
              key={t.id}
              to="/app/learn"
              className="group outline-pop-sm rounded-2xl bg-card p-6 transition-transform hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <span className="math inline-block rounded-md bg-highlight px-2 py-0.5 text-sm font-bold text-primary">
                0{i + 1}
              </span>
              <h3 className="mt-2 font-display text-xl font-bold">{t.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t.blurb}</p>
              <p className="mt-4 text-sm font-semibold text-chart-1 group-hover:underline">
                {lessons.filter((l) => l.topic === t.id).length} lessons →
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl border-2 border-primary bg-highlight text-primary">
                <f.icon className="size-5" />
              </span>
              <div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t-4 border-highlight bg-primary py-8 text-center text-sm text-primary-foreground/80">
        © 2026 MathConnect · Learn for free
      </footer>
    </div>
  )
}
