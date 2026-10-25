# MathConnect

A study platform for **trigonometric identities, exponential functions, and logarithmic functions**. It has nine worked lessons, a 30-question quiz bank, five formula games, and a PDF library where students and teachers share materials. Every PDF is checked for relevance and approved by an admin before it's published.

## What works

- Sign up (student or teacher), log in, log out, password reset by email. Sessions are cookies, checked on the server.
- Dashboard: Home, Learn, Quizzes, Games, My Materials, Shared Materials, Profile, and Admin (admin only).
- PDF uploads: checked (PDF, ≤2 MB), stored privately in Supabase Storage, text extracted, scored for relevance, then queued. Nothing is published until the admin approves it.
- Admin: review queue with in-browser PDF preview, approve/reject with feedback, user roles and teacher verification.
- Quiz and game progress is saved in the browser (moves to the database in Milestone 4).

## Tech

TanStack Start (React 19), Vite, Tailwind CSS 4, shadcn/ui, Supabase (Auth, Postgres + RLS, Storage), unpdf. Deploys to Netlify or runs as a Docker container.

## Run locally

Needs Node 22.13+ and Docker Desktop (for local Supabase).

```bash
pnpm install
npm run db:start        # local Supabase in Docker; prints the API URL and keys
cp .env.example .env    # paste SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY, set ADMIN_EMAIL / ADMIN_PASSWORD
npm run admin:create    # creates the single admin account
npm run dev             # http://localhost:3000
```

Local emails (signup confirmation, password reset) land in Mailpit at http://127.0.0.1:54324. Supabase Studio is at http://127.0.0.1:54323.

## Run with Docker

```bash
npm run db:start        # Supabase (once)
docker compose up -d --build
```

The app runs at http://localhost:3000. The container reaches local Supabase through `host.docker.internal`. To point it at a hosted Supabase project instead, set `DOCKER_SUPABASE_URL` (or `SUPABASE_URL`) and the keys in `.env`.

## Deploy to Netlify

Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SITE_URL` as Netlify environment variables, apply `supabase/migrations/` to your project (`npx supabase db push`, or paste [supabase/setup.sql](supabase/setup.sql) into the dashboard's SQL Editor and run it once), add `<SITE_URL>/auth/callback` to the project's Auth redirect URLs, then run `npm run admin:create` once with that project's service-role key.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on :3000 |
| `npm run build` | Netlify build (`TARGET=node` for the Docker/Node build) |
| `npm start` | Serve the Node build (`server.mjs`) |
| `npm run db:start` / `db:stop` / `db:reset` | Local Supabase |
| `npm run admin:create` | Create or reset the admin from `.env` |
| `npm run typecheck`, `lint`, `test` | Checks |

## Roadmap

See [PLAN.md](PLAN.md).
