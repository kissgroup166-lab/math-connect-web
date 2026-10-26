# AGENTS.md

This document describes the project for developers and AI agents working on this codebase.

> **Continue from [PLAN.md](PLAN.md).** Milestones 1–3 are complete (product surface, Supabase auth and roles, PDF upload pipeline), and so is Milestone 4 (content management and account-saved progress). Next is Milestone 5.

## Project Overview

**MathConnect** is a study platform limited to three topics: trigonometric identities, exponential functions, and logarithmic functions. It has lessons, quizzes, five games, and a PDF sharing workflow. In that workflow, uploads are scored for relevance against a lesson and must be approved by the single admin (the site owner) before they appear in Shared Materials.

### MathConnect architecture

- `src/routes/index.tsx`: the landing page. `login.tsx`, `signup.tsx`, `forgot-password.tsx`, and `reset-password.tsx` are the auth screens. `auth.callback.ts` exchanges email-link codes for a session. `api.files.$id.ts` streams PDFs after an RLS check.
- `src/routes/app.tsx`: the dashboard layout (`AppShell` in `src/components/app-shell.tsx`, with the sidebar and topic search). Child routes: `app.index` (Home), `app.learn.index`, `app.learn.$lessonId`, `app.quizzes` (`?topic=` starts a quiz), `app.games.index`, `app.games.$gameId`, `app.materials`, `app.shared`, `app.profile`, and the admin pages under `app.admin` (overview, `review`, `users`, `lessons` with `lessons.$lessonId` editor, `quizzes`, `games`). The admin gets its own sidebar menu, and `/app` redirects the admin to `/app/admin`.
- Course content (topics, lessons, quiz questions, Find the Error items) lives in Supabase tables (`supabase/migrations/20261028000000_content.sql`, which also seeds the original 9 lessons and 30 questions). Only the admin writes it, from the admin pages. `src/lib/content.ts` has the types and `useContent()`; the root route loads published content (`currentContent`, cached for 5 minutes in the browser and 60 seconds on the server). `content.functions.ts` has the admin save/delete functions; call `forgetContent()` and `router.invalidate()` after a write (`useContentAction` in `admin-editor.tsx` does this).
- `src/lib/supabase.server.ts`: the server-only Supabase client (cookie session) and `requireViewer`/`requireAdmin`. The browser never talks to Supabase directly.
- `src/lib/*.functions.ts`: server functions for auth, submissions (including the upload pipeline), and users. `pdf-check.server.ts` extracts text with unpdf and picks the queue status. It never returns `approved`.
- `src/lib/submissions.ts`: shared submission and user types and the status copy.
- `supabase/migrations/`: the schema, triggers, RLS, and Storage policies. `scripts/create-admin.mjs` creates the single admin.
- `/app` routes require a session (`beforeLoad` in `app.tsx`), and `/app/admin` requires the admin role.
- `src/lib/relevance.ts`: a pure `scoreRelevance(text, lesson)` and its bands (80+ relevant and pending approval, 50–79 needs review, under 50 unrelated). Short or empty text is flagged for manual review. Scores never auto-publish anything.
- `src/lib/progress.ts`: `useProgress()` is a shared store of the user's progress (quiz bests and attempts, answered questions, game bests, unfinished quiz runs), saved to `user_progress` through `progress.functions.ts`. Old browser-only progress is copied to the account once. Per-quiz random order and choice shuffling come from `quiz_settings` (admin → Quizzes).
- `src/components/games/`: one file per game, registered in `index.ts`. Each game takes `{ onFinish(score), best }`.
- `src/components/submission-bits.tsx`: the shared `StatusBadge`, `ScoreMeter`, and `SubmissionRow` components.

### Non-obvious decisions

- The admin role is never selectable at signup or in the user table. It's reserved for the owner, and later enforced in the database by a trigger and RLS (see PLAN.md).
- The backend is Supabase, not Netlify Database. Locally it's the Supabase CLI (`npm run db:start`). Env vars are in `.env.example`.
- Docker: `TARGET=node vite build` drops the Netlify plugin, and `server.mjs` (srvx) serves the build. See `Dockerfile` and `docker-compose.yml`.
- Lesson progress is derived from the quiz questions answered correctly (`lessonPct` in `progress.ts`).
- Fonts: Bricolage Grotesque (headings), Figtree (body), JetBrains Mono (`.math` class for formulas). `.graph-paper` is a utility in `styles.css`.

### Tech Stack

| Layer         | Technology                                          |
| ------------- | --------------------------------------------------- |
| Framework     | TanStack Start                                      |
| Frontend      | React 19, TanStack Router                           |
| Build         | Vite 8                                              |
| Styling       | Tailwind CSS 4, theme variables in `src/styles.css` |
| UI Components | shadcn/ui (Radix UI + Tailwind)                     |
| Toasts        | sonner                                              |
| Icons         | lucide-react                                        |
| Language      | TypeScript 6.0 (strict mode)                        |
| Deployment    | Netlify, via `@netlify/vite-plugin-tanstack-start`  |

## Directory Structure

```
├── public
│   └── favicon.ico
├── src
│   ├── components
│   │   ├── error-pages.tsx # Themed 404 and route error pages with home/retry actions.
│   │   └── ui          # shadcn/ui controls, overlays, feedback, forms, and tables.
│   ├── examples
│   │   └── validated-form.tsx # Unmounted form pattern with validation, pending, error, and success states.
│   ├── lib
│   │   └── utils.ts    # cn() helper for merging Tailwind classes.
│   ├── routes
│   │   ├── __root.tsx  # HTML shell, <head> metadata (siteName, siteDescription), the tooltip provider, and the toast container.
│   │   └── index.tsx   # Home route (/): placeholder page to replace.
│   ├── router.tsx      # Creates the router from the generated route tree.
│   └── styles.css      # Tailwind import, theme variables for light and dark mode, base styles.
├── components.json     # shadcn/ui config, used by `npx shadcn add`.
├── netlify.toml        # Build command, publish directory, dev server ports.
├── package.json
├── tsconfig.json
└── vite.config.ts      # Vite path aliases and Tailwind, Netlify, TanStack Start, React plugins.
```

`src/routeTree.gen.ts` is generated by the router plugin when the dev server or build runs. Don't edit it.

Shared framework skill source lives in `frameworks/tanstack-start-react/.claude/skills` in this repository, separate from the standalone starter. Consult the matching framework/Netlify skills when available in a generated app; don't assume the starter contains a `.claude` directory.

## Key Concepts

### File-Based Routing

Route files in `src/routes/` define pages and endpoints:

- `__root.tsx` wraps every page.
- `index.tsx` is `/`.
- `about.tsx` would be `/about`.
- `api.*.ts` files are server API endpoints. See the `tanstack-start-api-routes` skill.

### Theme Variables

Colors and corner radius are CSS variables in `src/styles.css` (`--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--radius`, and more), with a second set under `.dark`. Tailwind exposes them as classes such as `bg-primary`, `text-muted-foreground`, and `border-border`.

Set these variables for the product before you build any page. In components, use the variable classes instead of raw colors like `bg-white` or `text-gray-600`, so the whole site changes when a variable changes.

### UI Components

Ready-made components are in `src/components/ui/`. Use them before writing your own, and restyle them through the theme variables or their variants. Add more with `npx shadcn add <name>`. Show a toast by calling `toast()` from `sonner`; the container is already mounted in `__root.tsx`. `TooltipProvider` is mounted there too, so `Tooltip` works anywhere without its own provider.

| Need               | Components                                                         |
| ------------------ | ------------------------------------------------------------------ |
| Actions and status | Button, Badge, Progress, Skeleton, Alert, Sonner                   |
| Forms              | Input, Textarea, Label, Checkbox, RadioGroup, Switch, Select, Form |
| Overlays and menus | Dialog, Sheet, Popover, DropdownMenu, Tooltip                      |
| Content and layout | Card, Tabs, Accordion, Separator, Table                            |

Use `Form` with React Hook Form and the Zod resolver. Start from `src/examples/validated-form.tsx`; it isn't mounted or connected to a backend. Its required `onSubmit` callback must reject on failure. See [the form pattern](docs/forms.md) for HTTP submission and error handling.

Use Sheet for a mobile menu and DropdownMenu for short action lists. Give Dialog and Sheet an accessible title and description. Pair Checkbox, RadioGroup, Switch, and inputs with visible labels. Reserve tables for tabular data and wrap them in their provided scroll container.

### Design Choices

Set the product's palette, heading/body fonts, and layout before building its screens. Use an explicit user design when supplied; otherwise choose defaults that fit the product. Keep Basic's placeholder until you replace it with the requested product.

- Set `--font-body` and `--font-heading` in `src/styles.css`. Use `font-display` for headings when the product needs a separate heading font.
- Use `max-w-content` for a page container and `max-w-reading` for long text. Keep consistent horizontal padding, such as `px-4 sm:px-6`, and a small repeated spacing scale, such as `gap-4`, `gap-6`, and `py-12`.
- Keep one main heading per page and a clear heading order. Use muted text for supporting copy, not essential low-contrast labels.
- Preserve focus rings. Give icon-only buttons an accessible name. Ensure actions work with a keyboard and on narrow screens.
- Use short color/opacity transitions. Add `motion-reduce:transition-none` or `motion-reduce:animate-none` when adding motion; don't make essential content depend on animation.
- Provide loading, empty, error, and success states for each data-driven screen. Skeletons should follow the shape of the content they replace.

### Routing and Server Data

Router types are registered in `src/router.tsx`, so use typed `Link` destinations and route parameters. The root route supplies the themed 404 page; the router's default error component supplies the safe retry/home page, including child-route SSR failures. Use `throw notFound()` for absent records; keep unexpected failures on the error path. See [routing conventions](src/routes/README.md).

Start with route loaders and server functions for server data. Validate server-function input with `.validator(...)`, keep secrets on the server, and handle HTTP failures before returning data. See [the data-fetching pattern](docs/data-fetching.md). Add TanStack Query only when client-side caching, mutations, or background refresh are needed.

### Browser Storage

Pages are rendered on the server first, where `window` and `localStorage` don't exist. Read `localStorage` inside `useEffect`, not during render or in a `useState` initializer, or the first render will differ from the server HTML and React will log a hydration error.

## Configuration Files

| File             | Purpose                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| `vite.config.ts` | Vite path aliases and Tailwind, Netlify, TanStack Start, React plugins                           |
| `tsconfig.json`  | Strict TypeScript, with the `@/*` alias for `src/*`                                              |
| `netlify.toml`   | Builds with `vite build`, publishes `dist/client`, dev server on port 8888 proxying Vite on 3000 |

## Development Commands

Use Node 22.13+ on the Node 22 line, Node 24, or Node 26+. The installed lint and test tools set this minimum alongside the framework.

```bash
npm run dev        # Start the Vite dev server on port 3000
npm run build      # Production build
npm run typecheck  # Type-check with tsc; the build doesn't
npm run lint       # Check TypeScript and React Hooks rules
npm run format:check # Check formatting
npm run format     # Format project files
npm test           # Run local form, control, and error page tests
npm run preview    # Preview the production build
```

## Conventions

- Components: PascalCase. Utilities and hooks: camelCase. Route files: kebab-case.
- Import from `src` with the `@/` alias.
- TypeScript fails on unused locals and parameters, so remove what you don't use.
- Use React hooks for state.
- Run the dev server or build once to generate route types before type-checking a fresh copy.
- Run build, typecheck, lint, format:check, and tests before reporting completion. Verify changed user flows locally; a passing build doesn't prove an interaction works.

## Application Name

Set the product's name and description in `src/routes/__root.tsx`:

- `siteName` is the page title and the title shown when the link is shared.
- `siteDescription` is the meta description and the description shown when the link is shared.

Then replace the placeholder heading and text in `src/routes/index.tsx`.
