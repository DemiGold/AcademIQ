-- ============================================================
-- ACADEMIQ — ADMIN RPCs
-- Run AFTER academiq_schema_v1.sql.
-- If you ever re-run the main schema file (it drops tables), re-run this too.
--
-- Every function checks is_admin() itself, so a student calling
-- them gets 'forbidden'. The admin panel's hidden pages are NOT
-- the security; these checks and the RLS policies are.
--
-- Course / topic / question CRUD and attempts analytics need no RPCs:
-- the admin RLS policies already allow them directly via supabase.from(...).
-- ============================================================

-- Store the price each token was sold at, so revenue is real, not Premium x 2000.
alter table tokens add column if not exists price_naira int not null default 2000;

-- ------------------------------------------------------------
-- STATS (overview dashboard)
-- ------------------------------------------------------------
create or replace function admin_stats()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_students int;
  v_premium int;
begin
  if not is_admin() then raise exception 'forbidden'; end if;

  select count(*) into v_students from profiles where role = 'student';
  select count(*) into v_premium  from profiles
    where role = 'student' and premium_expires_at > now();

  return jsonb_build_object(
    'total_students',   v_students,
    'premium_students', v_premium,
    'free_students',    v_students - v_premium,
    'admin_accounts',   (select count(*) from profiles where role = 'super_admin'),
    'tokens_total',     (select count(*) from tokens),
    'tokens_claimed',   (select count(*) from tokens where is_used),
    'tokens_unused',    (select count(*) from tokens where not is_used),
    'revenue_naira',    (select coalesce(sum(price_naira), 0) from tokens where is_used),
    'attempts_total',   (select count(*) from exam_attempts)
  );
end $$;

-- ------------------------------------------------------------
-- USERS
-- ------------------------------------------------------------
create or replace function admin_list_users(
  p_search text default null,
  p_limit int default 50,
  p_offset int default 0
)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_total int;
  v_rows jsonb;
  v_like text := '%' || coalesce(trim(p_search), '') || '%';
begin
  if not is_admin() then raise exception 'forbidden'; end if;

  select count(*) into v_total
  from profiles p join auth.users u on u.id = p.id
  where u.email ilike v_like or p.username ilike v_like
     or p.full_name ilike v_like or p.student_id ilike v_like;

  select coalesce(jsonb_agg(t order by t.created_at desc), '[]'::jsonb) into v_rows
  from (
    select p.id, u.email::text as email, p.username, p.full_name, p.phone,
           p.student_id, p.department, p.academic_year, p.role,
           p.premium_expires_at, p.created_at
    from profiles p join auth.users u on u.id = p.id
    where u.email ilike v_like or p.username ilike v_like
       or p.full_name ilike v_like or p.student_id ilike v_like
    order by p.created_at desc
    limit least(greatest(p_limit, 1), 200) offset greatest(p_offset, 0)
  ) t;

  return jsonb_build_object('total', v_total, 'rows', v_rows);
end $$;

-- Set exact premium expiry. NULL or a past date = revoke.
-- Grant 30 days from the app with: new Date(Date.now() + 30*864e5).toISOString()
create or replace function admin_set_premium(p_user_id uuid, p_expires_at timestamptz)
returns timestamptz
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'forbidden'; end if;

  update profiles set premium_expires_at = p_expires_at where id = p_user_id;
  if not found then raise exception 'user not found'; end if;

  return p_expires_at;
end $$;

create or replace function admin_update_username(p_user_id uuid, p_username text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  if length(trim(p_username)) < 3 then raise exception 'username too short'; end if;

  update profiles set username = trim(p_username) where id = p_user_id;
  if not found then raise exception 'user not found'; end if;
end $$;

-- ------------------------------------------------------------
-- TOKENS
-- ------------------------------------------------------------
create or replace function admin_generate_tokens(p_count int default 10, p_price int default 2000)
returns text[]
language plpgsql security definer set search_path = public as $$
declare
  v_codes text[];
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  if p_count < 1 or p_count > 100 then raise exception 'count must be 1-100'; end if;
  if p_price < 0 then raise exception 'invalid price'; end if;

  select array_agg(c) into v_codes from generate_tokens(p_count) c;
  update tokens set price_naira = p_price where token_code = any(v_codes);

  return v_codes;
end $$;

-- p_status: 'all' | 'used' | 'unused'
create or replace function admin_list_tokens(
  p_status text default 'all',
  p_limit int default 100,
  p_offset int default 0
)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_total int;
  v_rows jsonb;
begin
  if not is_admin() then raise exception 'forbidden'; end if;

  select count(*) into v_total from tokens t
  where p_status = 'all'
     or (p_status = 'used' and t.is_used)
     or (p_status = 'unused' and not t.is_used);

  select coalesce(jsonb_agg(r order by r.created_at desc), '[]'::jsonb) into v_rows
  from (
    select t.id, t.token_code, t.is_used, t.used_at, t.created_at, t.price_naira,
           u.email::text as used_by_email
    from tokens t
    left join auth.users u on u.id = t.used_by
    where p_status = 'all'
       or (p_status = 'used' and t.is_used)
       or (p_status = 'unused' and not t.is_used)
    order by t.created_at desc
    limit least(greatest(p_limit, 1), 500) offset greatest(p_offset, 0)
  ) r;

  return jsonb_build_object('total', v_total, 'rows', v_rows);
end $$;

-- Only unused tokens can be deleted (used ones are your sales record).
create or replace function admin_delete_token(p_token_id uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  delete from tokens where id = p_token_id and is_used = false;
  return found;
end $$;

-- ------------------------------------------------------------
-- PERMISSIONS: signed-in users may call them; each one still checks is_admin()
-- ------------------------------------------------------------
revoke execute on function
  admin_stats(),
  admin_list_users(text, int, int),
  admin_set_premium(uuid, timestamptz),
  admin_update_username(uuid, text),
  admin_generate_tokens(int, int),
  admin_list_tokens(text, int, int),
  admin_delete_token(uuid)
from public, anon;

grant execute on function
  admin_stats(),
  admin_list_users(text, int, int),
  admin_set_premium(uuid, timestamptz),
  admin_update_username(uuid, text),
  admin_generate_tokens(int, int),
  admin_list_tokens(text, int, int),
  admin_delete_token(uuid)
to authenticated;