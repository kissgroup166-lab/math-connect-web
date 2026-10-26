# MathConnect roadmap

MathConnect is a study platform for three topics: trigonometric identities, exponential functions, and logarithmic functions. Students and teachers share PDFs that are checked for relevance and approved by the site owner before anyone else can see them.

The work is split into milestones. Each one can ship on its own.

## Milestone 1: Product surface ✅ (done)

- Landing page, plus Login, Signup (Student or Teacher, never Admin), and Forgot Password screens.
- Dashboard shell with Home, Learn, Quizzes, Games, My Materials, Shared Materials, Profile, and Admin. Includes topic search and a mobile menu.
- **Real content:** 9 lessons (3 per topic) with formulas, explanations, step-by-step worked examples, and auto-checked practice (now in Supabase; see Milestone 4).
- **Playable now:** 30 quiz questions with explanations, scoring, retries, and saved best scores, plus all five games (Formula Match, Equation Puzzle, Math Challenge, Find the Error, Formula Memory). Progress is saved in the browser for now (`src/lib/progress.ts`).
- My Materials upload card: dashed drop zone, folder icon, empty state, PDF-only and size checks, a required lesson, and a status tracker.
- Admin: review queue (pending, approved, rejected), a preview dialog, approve/reject with feedback, user role and teacher-permission management, and a content overview.
- Relevance scorer (`src/lib/relevance.ts`): a pure function over extracted text with the 80/50 band thresholds. It isn't called yet.
- Users, submissions, and lesson progress are stubbed in `src/data/fixtures.ts`.

## Milestone 2: Supabase auth and roles ✅ (done)

Built as planned, with one change: the app never uses the service-role key. All queries run under the user's session, so RLS always applies. Admin is granted only by `scripts/create-admin.mjs` (service role), and a trigger blocks every other path to or from admin.

- Add `@supabase/supabase-js` and `@supabase/ssr`. Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` (server only) as Netlify environment variables. These are **not configured yet** and must come from the owner's existing Supabase project.
- Wire up signup, login, logout, and password recovery (including the `/reset-password` landing route), with cookie-based sessions for SSR.
- Add a `profiles` table (id → auth.users, full_name, role `student|teacher|admin`, teacher_verified). New rows are forced to `student` or `teacher` by a trigger. Admin is assigned only to the owner's email (`ADMIN_EMAIL`) by a security-definer function and can never be set from the client.
- Protect the `/app` routes (redirect to `/login`) and `/app/admin` (admin only), checked on the server.
- Write RLS policies: users read and update their own profile, but can't change their own role.

## Milestone 3: PDF upload pipeline ✅ (done)

Files are served through `/api/files/$id` (an RLS check, then a stream from Storage) instead of signed URLs, so the browser never needs the Supabase URL. Schema: `supabase/migrations/`.

- Create a private Supabase Storage bucket `materials` with a 2 MB limit (lowered from 10 MB) and `application/pdf` only. Path: `{user_id}/{submission_id}.pdf`.
- Add a `submissions` table: id, owner_id, lesson_id, title, file_path, size, status, score, band, explanation, matched_keywords, flags, admin_feedback, reviewed_by, and timestamps.
- Add a server function or Netlify Function that verifies the session, checks size and type again, extracts text (e.g. `unpdf`), detects encrypted, scanned, or near-empty files, runs `scoreRelevance`, and saves the result. It never sets `approved`.
- RLS: owners see their own rows. Everyone signed in sees `approved` rows. Only the admin sees everything and can update status.
- Storage policies: owners read their own files, approved files are served through short-lived signed URLs, and the admin can read everything.
- Replace the fixtures in My Materials, Shared Materials, and Admin with these queries. Enable real downloads and the in-browser PDF preview for the admin.

## Milestone 4: Progress and content management

- ✅ Progress is saved per account in one `user_progress` row (owner-only RLS): quiz bests and attempts, questions answered, game bests, and unfinished quizzes, which resume on any device. Browser-saved progress is copied over once. The admin sets random question order and shuffled choices per quiz (`quiz_settings`).
- ✅ Admin-only content management: `topics`, `lessons`, `questions`, and `error_items` tables (seeded from the old data files), editors under Admin → Topics & lessons, Quizzes, and Games, and a show/hide switch on each item. The admin has its own menu. Teachers can't edit content (owner's decision).

## Milestone 5: Hardening and QA

- End-to-end tests for signup and login, upload, relevance bands, admin approval, downloads, quizzes, and games.
- Audit logging for admin decisions, rate limiting on uploads, and email notifications when a submission is reviewed.
