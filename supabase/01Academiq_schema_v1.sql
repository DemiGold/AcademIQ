-- ============================================================
-- ACADEMIQ v1 — SCHEMA, RLS, FUNCTIONS
-- Run in Supabase SQL Editor (one go).
-- ============================================================

-- ------------------------------------------------------------
-- 0. RESET (only safe because there is no real data yet)
-- ------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
drop table if exists exam_answers, exam_attempts, token_attempts, tokens,
                     questions, topics, courses, profiles cascade;
drop function if exists handle_new_user() cascade;
drop function if exists redeem_token(text, uuid);
drop function if exists redeem_token(text);
drop function if exists is_admin();
drop function if exists get_questions_for_course(uuid, uuid);
drop function if exists submit_attempt(uuid, uuid, jsonb);
drop function if exists generate_tokens(int);
drop function if exists touch_updated_at() cascade;

-- ------------------------------------------------------------
-- 1. TABLES
-- ------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique,
  full_name text,
  phone text,
  dob date,
  student_id text,
  department text,
  academic_year text,
  role text not null default 'student' check (role in ('student', 'super_admin')),
  premium_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table courses (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table topics (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

create table questions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses on delete cascade,
  topic_id uuid references topics on delete set null,
  question_text text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4),
  correct_index int not null check (correct_index between 0 and 3),
  explanation text,
  academic_session text,   -- e.g. '2022/2023'
  semester text,
  institution text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  is_free boolean not null default false,   -- YOU choose which ~10 per course are free
  created_at timestamptz default now()
);

create table tokens (
  id uuid primary key default gen_random_uuid(),
  token_code text unique not null,
  is_used boolean not null default false,
  used_by uuid references profiles(id),
  used_at timestamptz,
  created_at timestamptz default now()
);

create table token_attempts (            -- for rate limiting redemption
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  success boolean not null,
  created_at timestamptz default now()
);

create table exam_attempts (
  id uuid primary key default gen_random_uuid(),
  client_uuid uuid unique not null,      -- makes sync idempotent
  user_id uuid not null references profiles(id) on delete cascade,
  course_id uuid not null references courses(id),
  score_percent int not null,
  correct_count int not null,
  total_questions int not null,
  created_at timestamptz default now()
);

create table exam_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references exam_attempts(id) on delete cascade,
  question_id uuid not null references questions(id),
  selected_index int check (selected_index between 0 and 3),
  is_correct boolean not null default false,
  created_at timestamptz default now(),
  unique (attempt_id, question_id)
);

-- ------------------------------------------------------------
-- 2. INDEXES
-- ------------------------------------------------------------
create index idx_questions_course_status on questions(course_id, status);
create index idx_questions_topic on questions(topic_id);
create index idx_topics_course on topics(course_id);
create index idx_attempts_user on exam_attempts(user_id, created_at desc);
create index idx_answers_attempt on exam_answers(attempt_id);
create index idx_token_attempts_user_time on token_attempts(user_id, created_at);

-- ------------------------------------------------------------
-- 3. HELPERS
-- ------------------------------------------------------------
create or replace function is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'super_admin');
$$;

create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger profiles_touch before update on profiles
  for each row execute function touch_updated_at();

-- Auto-create profile on signup. Register screen passes these in
-- supabase.auth.signUp({ options: { data: { full_name, phone, dob, ... } } })
-- dob must be ISO format: YYYY-MM-DD
create or replace function handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles
    (id, username, full_name, phone, dob, student_id, department, academic_year)
  values (
    new.id,
    split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 4),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    nullif(new.raw_user_meta_data->>'dob', '')::date,
    new.raw_user_meta_data->>'student_id',
    new.raw_user_meta_data->>'department',
    new.raw_user_meta_data->>'academic_year'
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- ------------------------------------------------------------
alter table profiles        enable row level security;
alter table courses         enable row level security;
alter table topics          enable row level security;
alter table questions       enable row level security;
alter table tokens          enable row level security;
alter table token_attempts  enable row level security;
alter table exam_attempts   enable row level security;
alter table exam_answers    enable row level security;

-- PROFILES -------------------------------------------------
-- Privilege escalation is blocked with COLUMN GRANTS, not policy subqueries.
-- Clients can only ever update the columns listed below.
revoke all on profiles from anon, authenticated;
grant select on profiles to authenticated;
grant update (username, full_name, phone, dob, student_id, department, academic_year)
  on profiles to authenticated;

create policy profiles_select on profiles for select to authenticated
  using (id = auth.uid() or is_admin());

create policy profiles_update on profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- COURSES / TOPICS -----------------------------------------
create policy courses_select on courses for select to authenticated
  using (is_active or is_admin());

create policy topics_select on topics for select to authenticated
  using (
    exists (select 1 from courses c where c.id = topics.course_id and c.is_active)
    or is_admin()
  );

create policy courses_admin on courses for all to authenticated
  using (is_admin()) with check (is_admin());
create policy topics_admin on topics for all to authenticated
  using (is_admin()) with check (is_admin());

-- QUESTIONS ------------------------------------------------
-- Students get NO direct table access. They read through
-- get_questions_for_course() below. Only admins can touch the table directly.
create policy questions_admin on questions for all to authenticated
  using (is_admin()) with check (is_admin());

-- TOKENS ---------------------------------------------------
-- No policies = no client access. Locked down explicitly as well.
revoke all on tokens, token_attempts from anon, authenticated;

-- EXAM ATTEMPTS / ANSWERS ----------------------------------
-- Clients can only READ their own. Writes go through submit_attempt().
revoke insert, update, delete on exam_attempts, exam_answers from anon, authenticated;

create policy attempts_select on exam_attempts for select to authenticated
  using (user_id = auth.uid() or is_admin());

create policy answers_select on exam_answers for select to authenticated
  using (
    exists (select 1 from exam_attempts a
            where a.id = exam_answers.attempt_id
              and (a.user_id = auth.uid() or is_admin()))
  );

-- ------------------------------------------------------------
-- 5. RPC: GET QUESTIONS (free vs premium handled here)
-- ------------------------------------------------------------
create or replace function get_questions_for_course(
  p_course_id uuid,
  p_topic_id uuid default null
)
returns setof questions
language sql stable security definer set search_path = public as $$
  select q.*
  from questions q
  where q.course_id = p_course_id
    and q.status = 'published'
    and (p_topic_id is null or q.topic_id = p_topic_id)
    and (
      q.is_free
      or exists (select 1 from profiles p
                 where p.id = auth.uid() and p.premium_expires_at > now())
    )
  order by q.created_at, q.id;
$$;

revoke execute on function get_questions_for_course(uuid, uuid) from public, anon;
grant  execute on function get_questions_for_course(uuid, uuid) to authenticated;

-- ------------------------------------------------------------
-- 6. RPC: REDEEM TOKEN (atomic, rate-limited, uses auth.uid())
--    Call from app: supabase.rpc('redeem_token', { p_code: 'ACAD-XXXX-XXXX' })
--    No Edge Function needed.
-- ------------------------------------------------------------
create or replace function redeem_token(p_code text)
returns json
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_code text := upper(trim(p_code));
  v_token_id uuid;
  v_expiry timestamptz;
  v_fails int;
begin
  if v_uid is null then
    return json_build_object('success', false, 'message', 'Not signed in');
  end if;

  select count(*) into v_fails
  from token_attempts
  where user_id = v_uid and success = false
    and created_at > now() - interval '15 minutes';

  if v_fails >= 5 then
    return json_build_object('success', false,
      'message', 'Too many wrong attempts. Try again in 15 minutes.');
  end if;

  -- lock the row; a concurrent redeemer waits, then finds it used
  select id into v_token_id
  from tokens
  where token_code = v_code and is_used = false
  for update;

  if not found then
    insert into token_attempts (user_id, success) values (v_uid, false);
    return json_build_object('success', false, 'message', 'Invalid or already used token');
  end if;

  update tokens
  set is_used = true, used_by = v_uid, used_at = now()
  where id = v_token_id;

  update profiles
  set premium_expires_at = greatest(coalesce(premium_expires_at, now()), now()) + interval '30 days'
  where id = v_uid
  returning premium_expires_at into v_expiry;

  insert into token_attempts (user_id, success) values (v_uid, true);

  return json_build_object('success', true,
    'message', 'Premium unlocked', 'expires_at', v_expiry);
end $$;

revoke execute on function redeem_token(text) from public, anon;
grant  execute on function redeem_token(text) to authenticated;

-- ------------------------------------------------------------
-- 7. RPC: SUBMIT / SYNC AN ATTEMPT (idempotent, one atomic call)
--    p_answers = [{ "question_id": "...", "selected_index": 2 | null }, ...]
--    Include unanswered questions with selected_index null.
--    Server re-scores from the questions table, so stored scores are trustworthy.
-- ------------------------------------------------------------
create or replace function submit_attempt(
  p_client_uuid uuid,
  p_course_id uuid,
  p_answers jsonb
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_attempt uuid;
  v_total int;
  v_correct int;
begin
  if v_uid is null then
    raise exception 'Not signed in';
  end if;

  if jsonb_typeof(p_answers) <> 'array' or jsonb_array_length(p_answers) > 200 then
    raise exception 'Invalid or oversized answers payload';
  end if;

  -- already synced? return the existing attempt (safe retries)
  select id into v_attempt
  from exam_attempts
  where client_uuid = p_client_uuid and user_id = v_uid;
  if found then
    return v_attempt;
  end if;

  insert into exam_attempts
    (client_uuid, user_id, course_id, score_percent, correct_count, total_questions)
  values (p_client_uuid, v_uid, p_course_id, 0, 0, 0)
  returning id into v_attempt;

  insert into exam_answers (attempt_id, question_id, selected_index, is_correct)
  select v_attempt,
         q.id,
         (x->>'selected_index')::int,
         coalesce(q.correct_index = (x->>'selected_index')::int, false)
  from jsonb_array_elements(p_answers) x
  join questions q on q.id = (x->>'question_id')::uuid
  where q.course_id = p_course_id
  on conflict (attempt_id, question_id) do nothing;

  select count(*), count(*) filter (where is_correct)
  into v_total, v_correct
  from exam_answers where attempt_id = v_attempt;

  if v_total = 0 then
    raise exception 'No valid answers submitted';
  end if;

  update exam_attempts
  set total_questions = v_total,
      correct_count = v_correct,
      score_percent = round(100.0 * v_correct / v_total)
  where id = v_attempt;

  return v_attempt;
end $$;

revoke execute on function submit_attempt(uuid, uuid, jsonb) from public, anon;
grant  execute on function submit_attempt(uuid, uuid, jsonb) to authenticated;

-- ------------------------------------------------------------
-- 8. TOKEN GENERATION (you run this in the SQL Editor, not the app)
--    select * from generate_tokens(10);
--    Format ACAD-XXXX-XXXX, no 0/O/1/I. Not callable by any client.
-- ------------------------------------------------------------
create or replace function generate_tokens(p_count int default 10)
returns setof text
language plpgsql security definer set search_path = public, extensions as $$
declare
  chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- 32 chars
  v_code text;
  b bytea;
  j int;
  made int := 0;
begin
  while made < p_count loop
    b := gen_random_bytes(8);
    v_code := 'ACAD-';
    for j in 0..7 loop
      v_code := v_code || substr(chars, (get_byte(b, j) % 32) + 1, 1);
      if j = 3 then v_code := v_code || '-'; end if;
    end loop;
    begin
      insert into tokens (token_code) values (v_code);
      made := made + 1;
      return next v_code;
    exception when unique_violation then
      null; -- collision, try again
    end;
  end loop;
end $$;

revoke execute on function generate_tokens(int) from public, anon, authenticated;

-- ------------------------------------------------------------
-- 9. SEED (dev only)
-- ------------------------------------------------------------
insert into courses (code, name) values
  ('MTH102', 'Elementary Mathematics II'),
  ('GST112', 'Communication in English II'),
  ('PHY102', 'General Physics II');

insert into topics (course_id, name) values
  ((select id from courses where code = 'MTH102'), 'Integration'),
  ((select id from courses where code = 'MTH102'), 'Vectors'),
  ((select id from courses where code = 'GST112'), 'Essay Writing'),
  ((select id from courses where code = 'GST112'), 'Comprehension'),
  ((select id from courses where code = 'PHY102'), 'Electricity'),
  ((select id from courses where code = 'PHY102'), 'Magnetism');

-- A few test questions so you can build the quiz before real content exists
insert into questions (course_id, topic_id, question_text, options, correct_index, explanation, status, is_free)
select c.id, t.id,
       'What is the integral of 2x dx?',
       '["x^2 + C", "2x^2 + C", "x + C", "2 + C"]'::jsonb, 0,
       'The power rule gives ∫2x dx = x² + C.', 'published', true
from courses c join topics t on t.course_id = c.id
where c.code = 'MTH102' and t.name = 'Integration';

insert into questions (course_id, topic_id, question_text, options, correct_index, explanation, status, is_free)
select c.id, t.id,
       'What is the integral of cos x dx?',
       '["-sin x + C", "sin x + C", "cos x + C", "-cos x + C"]'::jsonb, 1,
       'The derivative of sin x is cos x, so ∫cos x dx = sin x + C.', 'published', false
from courses c join topics t on t.course_id = c.id
where c.code = 'MTH102' and t.name = 'Integration';

-- ------------------------------------------------------------
-- 10. HANDY ADMIN SNIPPETS (run manually when needed)
-- ------------------------------------------------------------
-- Generate 10 tokens:
--   select * from generate_tokens(10);
--
-- Mark the first 10 published questions of a course as the free sample:
--   update questions set is_free = true
--   where id in (
--     select id from questions
--     where course_id = (select id from courses where code = 'MTH102')
--       and status = 'published'
--     order by created_at, id limit 10
--   );
--
-- Make yourself admin (after you sign up in the app):
--   update profiles set role = 'super_admin' where id = '<your-user-uuid>';
--
-- Manually grant 30 days premium:
--   update profiles set premium_expires_at = now() + interval '30 days'
--   where id = '<user-uuid>';