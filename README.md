# MathConnect

A study platform for **trigonometric identities, exponential functions, and logarithmic functions**. It has nine worked lessons, a 30-question quiz bank, five formula games, and a PDF library where students and teachers share materials. Every PDF is checked for relevance and approved by an admin before it's published.

## What works today

- Landing page and the login, signup, and password-reset screens. These are interface only: they don't connect to Supabase yet.
- Dashboard: Home (progress cards), Learn (9 lessons), Quizzes, Games, My Materials, Shared Materials, Profile, and Admin, with topic search.
- Fully playable: lesson practice, all quizzes (scoring, explanations, retries), and all five games. Progress is saved in the browser.
- The upload flow, review queue, and user management screens run on sample data from `src/data/fixtures.ts`.

## Tech

TanStack Start (React 19, TanStack Router), Vite, Tailwind CSS 4, shadcn/ui (Radix), lucide-react, and Netlify. Supabase (auth, Postgres, Storage, RLS) comes next. See the roadmap.

## Run locally

```bash
pnpm install
pnpm dev          # http://localhost:3000
# or, with Netlify emulation:
netlify dev
```

## Roadmap

See [PLAN.md](PLAN.md). Up next: Supabase auth and roles, then the real PDF upload pipeline (private storage, text extraction, relevance scoring, admin approval), then saving progress to the database.
