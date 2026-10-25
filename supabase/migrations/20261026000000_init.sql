-- MathConnect schema: profiles, roles, submissions, and the private `materials` bucket.
-- Admin is never assignable from the client. Only the service role (scripts/create-admin.mjs) can grant it.

create type public.app_role as enum ('student', 'teacher', 'admin');
create type public.submission_status as enum ('queued', 'pending', 'review', 'flagged', 'approved', 'rejected');
create type public.relevance_band as enum ('relevant', 'review', 'unrelated');

-- Profiles ------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  role public.app_role not null default 'student',
  teacher_verified boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- New auth users get a profile. Signup metadata may only pick student or teacher.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, ''),
    case when new.raw_user_meta_data ->> 'role' = 'teacher' then 'teacher'::public.app_role else 'student'::public.app_role end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Guards role changes. Nobody but the service role can grant or remove admin,
-- users can't change their own role or verification, and email is read-only.
create function public.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- session_user, not current_user: inside a security-definer function current_user is always the owner.
  if coalesce(auth.role(), '') = 'service_role' or session_user in ('postgres', 'supabase_admin') then
    return new;
  end if;
  if new.role = 'admin' or old.role = 'admin' then
    if new.role is distinct from old.role then
      raise exception 'The admin role can only be assigned by the site owner';
    end if;
  end if;
  if new.id = auth.uid() and (new.role is distinct from old.role or new.teacher_verified is distinct from old.teacher_verified) then
    raise exception 'You cannot change your own role or verification';
  end if;
  if new.email is distinct from old.email or new.id is distinct from old.id then
    raise exception 'Email and id are read-only';
  end if;
  return new;
end;
$$;

create trigger guard_profile_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

create policy "Read own profile or admin reads all" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());

create policy "Update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "Admin updates profiles" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Submissions ---------------------------------------------------------------

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  owner_name text not null,
  owner_role public.app_role not null,
  lesson_id text not null,
  title text not null check (char_length(title) between 1 and 200),
  file_name text not null,
  file_path text not null,
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 10485760),
  status public.submission_status not null default 'queued',
  score integer check (score between 0 and 100),
  band public.relevance_band,
  explanation text not null default '',
  matched_keywords text[] not null default '{}',
  flags text[] not null default '{}',
  admin_feedback text,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index submissions_owner_idx on public.submissions (owner_id, created_at desc);
create index submissions_status_idx on public.submissions (status);

alter table public.submissions enable row level security;

-- Inserts come from the upload server function under the user's session.
-- Owners can't approve themselves or pick their own name/role.
create function public.guard_submission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.profiles;
begin
  if tg_op = 'INSERT' then
    select * into p from public.profiles where id = auth.uid();
    if p.id is null then
      raise exception 'Profile not found';
    end if;
    if new.status in ('approved', 'rejected') then
      raise exception 'New submissions cannot be approved or rejected';
    end if;
    new.owner_id := p.id;
    new.owner_name := coalesce(nullif(p.full_name, ''), split_part(p.email, '@', 1));
    new.owner_role := p.role;
    new.admin_feedback := null;
    new.reviewed_by := null;
    new.reviewed_at := null;
  else
    if not public.is_admin() then
      raise exception 'Only the admin can review submissions';
    end if;
    new.updated_at := now();
  end if;
  return new;
end;
$$;

create trigger guard_submission
  before insert or update on public.submissions
  for each row execute function public.guard_submission();

create policy "Owners read own, everyone reads approved, admin reads all" on public.submissions
  for select to authenticated using (owner_id = auth.uid() or status = 'approved' or public.is_admin());

create policy "Owners insert own" on public.submissions
  for insert to authenticated with check (owner_id = auth.uid());

create policy "Admin reviews" on public.submissions
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Owners delete own unreviewed, admin deletes any" on public.submissions
  for delete to authenticated using ((owner_id = auth.uid() and status not in ('approved')) or public.is_admin());

-- Storage -------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('materials', 'materials', false, 10485760, array['application/pdf']);

-- Files live at {user_id}/{submission_id}.pdf.
create policy "Owners upload to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'materials' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Owners, admin, or anyone for approved files can read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'materials'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
      or exists (select 1 from public.submissions s where s.file_path = name and s.status = 'approved')
    )
  );

create policy "Owners or admin delete files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'materials' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
