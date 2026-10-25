# MathConnect roadmap

MathConnect is a study platform for three topics: trigonometric identities, exponential functions, and logarithmic functions. Students and teachers share PDFs that are checked for relevance and approved by the site owner before anyone else can see them.

The work is split into milestones. Each one can ship on its own.

## Milestone 1: Product surface ✅ (done)

- Landing page, plus Login, Signup (Student or Teacher, never Admin), and Forgot Password screens.
- Dashboard shell with Home, Learn, Quizzes, Games, My Materials, Shared Materials, Profile, and Admin. Includes topic search and a mobile menu.
- **Real content:** 9 lessons (3 per topic) with formulas, explanations, step-by-step worked examples, and auto-checked practice (`src/data/lessons.ts`).
- **Playable now:** 30 quiz questions with explanations, scoring, retries, and saved best scores, plus all five games (Formula Match, Equation Puzzle, Math Challenge, Find the Error, Formula Memory). Progress is saved in the browser for now (`src/lib/progress.ts`).
- My Materials upload card: dashed drop zone, folder icon, empty state, PDF-only and 10 MB checks, a required lesson, and a status tracker.
- Admin: review queue (pending, approved, rejected), a preview dialog, approve/reject with feedback, user role and teacher-permission management, and a content overview.
- Relevance scorer (`src/lib/relevance.ts`): a pure function over extracted text with the 80/50 band thresholds. It isn't called yet.
- Users, submissions, and lesson progress are stubbed in `src/data/fixtures.ts`.

## Milestone 2: Supabase auth and roles

- Add `@supabase/supabase-js` and `@supabase/ssr`. Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` (server only) as Netlify environment variables. These are **not configured yet** and must come from the owner's existing Supabase project.
- Wire up signup, login, logout, and password recovery (including the `/reset-password` landing route), with cookie-based sessions for SSR.
- Add a `profiles` table (id → auth.users, full_name, role `student|teacher|admin`, teacher_verified). New rows are forced to `student` or `teacher` by a trigger. Admin is assigned only to the owner's email (`ADMIN_EMAIL`) by a security-definer function and can never be set from the client.
- Protect the `/app` routes (redirect to `/login`) and `/app/admin` (admin only), checked on the server.
- Write RLS policies: users read and update their own profile, but can't change their own role.

## Milestone 3: PDF upload pipeline (priority)

- Create a private Supabase Storage bucket `materials` with a 10 MB limit and `application/pdf` only. Path: `{user_id}/{submission_id}.pdf`.
- Add a `submissions` table: id, owner_id, lesson_id, title, file_path, size, status, score, band, explanation, matched_keywords, flags, admin_feedback, reviewed_by, and timestamps.
- Add a server function or Netlify Function that verifies the session, checks size and type again, extracts text (e.g. `unpdf`), detects encrypted, scanned, or near-empty files, runs `scoreRelevance`, and saves the result. It never sets `approved`.
- RLS: owners see their own rows. Everyone signed in sees `approved` rows. Only the admin sees everything and can update status.
- Storage policies: owners read their own files, approved files are served through short-lived signed URLs, and the admin can read everything.
- Replace the fixtures in My Materials, Shared Materials, and Admin with these queries. Enable real downloads and the in-browser PDF preview for the admin.

## Milestone 4: Progress and content management

- Add `quiz_attempts`, `game_scores`, and `lesson_progress` tables with owner-only RLS. Replace `useProgress` browser storage and the fixture progress.
- Let admins (and verified teachers, where allowed) edit lessons, quiz questions, and game content from the Admin tab, backed by `lessons`/`questions` tables seeded from the current data files.

## Milestone 5: Hardening and QA

- End-to-end tests for signup and login, upload, relevance bands, admin approval, downloads, quizzes, and games.
- Audit logging for admin decisions, rate limiting on uploads, and email notifications when a submission is reviewed.
