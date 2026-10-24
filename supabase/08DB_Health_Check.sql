-- ============================================================
-- ACADEMIQ — DATABASE HEALTH CHECK
-- Runs a full audit. Every row should say OK or INFO.
-- ERROR means something is missing or broken.
-- ============================================================

with checks as (

  -- ============================================================
  -- 1. TABLES
  -- ============================================================
  select 'TABLE' as category, 'profiles' as item,
    case when exists (select 1 from information_schema.tables
                      where table_schema='public' and table_name='profiles')
         then 'OK' else 'ERROR — missing' end as status
  union all select 'TABLE', 'courses',
    case when exists (select 1 from information_schema.tables
                      where table_schema='public' and table_name='courses')
         then 'OK' else 'ERROR — missing' end
  union all select 'TABLE', 'topics',
    case when exists (select 1 from information_schema.tables
                      where table_schema='public' and table_name='topics')
         then 'OK' else 'ERROR — missing' end
  union all select 'TABLE', 'questions',
    case when exists (select 1 from information_schema.tables
                      where table_schema='public' and table_name='questions')
         then 'OK' else 'ERROR — missing' end
  union all select 'TABLE', 'tokens',
    case when exists (select 1 from information_schema.tables
                      where table_schema='public' and table_name='tokens')
         then 'OK' else 'ERROR — missing' end
  union all select 'TABLE', 'token_attempts',
    case when exists (select 1 from information_schema.tables
                      where table_schema='public' and table_name='token_attempts')
         then 'OK' else 'ERROR — missing' end
  union all select 'TABLE', 'exam_attempts',
    case when exists (select 1 from information_schema.tables
                      where table_schema='public' and table_name='exam_attempts')
         then 'OK' else 'ERROR — missing' end
  union all select 'TABLE', 'exam_answers',
    case when exists (select 1 from information_schema.tables
                      where table_schema='public' and table_name='exam_answers')
         then 'OK' else 'ERROR — missing' end

  -- ============================================================
  -- 2. COLUMNS
  -- ============================================================
  union all select 'COLUMN', 'profiles.faculty',
    case when exists (select 1 from information_schema.columns
                      where table_schema='public' and table_name='profiles'
                        and column_name='faculty')
         then 'OK' else 'ERROR — missing' end
  union all select 'COLUMN', 'profiles.premium_expires_at',
    case when exists (select 1 from information_schema.columns
                      where table_schema='public' and table_name='profiles'
                        and column_name='premium_expires_at')
         then 'OK' else 'ERROR — missing' end
  union all select 'COLUMN', 'profiles.role',
    case when exists (select 1 from information_schema.columns
                      where table_schema='public' and table_name='profiles'
                        and column_name='role')
         then 'OK' else 'ERROR — missing' end
  union all select 'COLUMN', 'courses.target_faculties',
    case when exists (select 1 from information_schema.columns
                      where table_schema='public' and table_name='courses'
                        and column_name='target_faculties')
         then 'OK' else 'ERROR — missing' end
  union all select 'COLUMN', 'courses.target_faculty (should NOT exist)',
    case when not exists (select 1 from information_schema.columns
                          where table_schema='public' and table_name='courses'
                            and column_name='target_faculty')
         then 'OK' else 'ERROR — old column still present' end
  union all select 'COLUMN', 'questions.is_free',
    case when exists (select 1 from information_schema.columns
                      where table_schema='public' and table_name='questions'
                        and column_name='is_free')
         then 'OK' else 'ERROR — missing' end
  union all select 'COLUMN', 'questions.status',
    case when exists (select 1 from information_schema.columns
                      where table_schema='public' and table_name='questions'
                        and column_name='status')
         then 'OK' else 'ERROR — missing' end
  union all select 'COLUMN', 'tokens.price_naira',
    case when exists (select 1 from information_schema.columns
                      where table_schema='public' and table_name='tokens'
                        and column_name='price_naira')
         then 'OK' else 'ERROR — missing' end

  -- ============================================================
  -- 3. FUNCTIONS / RPCs
  -- ============================================================
  union all select 'FUNCTION', 'is_admin()',
    case when exists (select 1 from pg_proc where proname='is_admin')
         then 'OK' else 'ERROR — missing' end
  union all select 'FUNCTION', 'handle_new_user()',
    case when exists (select 1 from pg_proc where proname='handle_new_user')
         then 'OK' else 'ERROR — missing' end
  union all select 'FUNCTION', 'generate_tokens(int)',
    case when exists (select 1 from pg_proc where proname='generate_tokens')
         then 'OK' else 'ERROR — missing' end
  union all select 'FUNCTION', 'redeem_token(text)',
    case when exists (select 1 from pg_proc where proname='redeem_token')
         then 'OK' else 'ERROR — missing' end
  union all select 'FUNCTION', 'submit_attempt(uuid,uuid,jsonb)',
    case when exists (select 1 from pg_proc where proname='submit_attempt')
         then 'OK' else 'ERROR — missing' end
  union all select 'FUNCTION', 'get_questions_for_course(uuid,uuid)',
    case when exists (select 1 from pg_proc where proname='get_questions_for_course')
         then 'OK' else 'ERROR — missing' end
  union all select 'FUNCTION', 'admin_stats()',
    case when exists (select 1 from pg_proc where proname='admin_stats')
         then 'OK' else 'ERROR — missing' end
  union all select 'FUNCTION', 'admin_list_users',
    case when exists (select 1 from pg_proc where proname='admin_list_users')
         then 'OK' else 'ERROR — missing' end
  union all select 'FUNCTION', 'admin_set_premium',
    case when exists (select 1 from pg_proc where proname='admin_set_premium')
         then 'OK' else 'ERROR — missing' end
  union all select 'FUNCTION', 'admin_update_username',
    case when exists (select 1 from pg_proc where proname='admin_update_username')
         then 'OK' else 'ERROR — missing' end
  union all select 'FUNCTION', 'admin_generate_tokens',
    case when exists (select 1 from pg_proc where proname='admin_generate_tokens')
         then 'OK' else 'ERROR — missing' end
  union all select 'FUNCTION', 'admin_list_tokens',
    case when exists (select 1 from pg_proc where proname='admin_list_tokens')
         then 'OK' else 'ERROR — missing' end
  union all select 'FUNCTION', 'admin_delete_token',
    case when exists (select 1 from pg_proc where proname='admin_delete_token')
         then 'OK' else 'ERROR — missing' end
  union all select 'FUNCTION', 'admin_recent_activity',
    case when exists (select 1 from pg_proc where proname='admin_recent_activity')
         then 'OK' else 'ERROR — missing' end
  union all select 'FUNCTION', 'admin_signups_series',
    case when exists (select 1 from pg_proc where proname='admin_signups_series')
         then 'OK' else 'ERROR — missing' end
  union all select 'FUNCTION', 'admin_question_counts',
    case when exists (select 1 from pg_proc where proname='admin_question_counts')
         then 'OK' else 'ERROR — missing' end
  union all select 'FUNCTION', 'admin_list_attempts',
    case when exists (select 1 from pg_proc where proname='admin_list_attempts')
         then 'OK' else 'ERROR — missing' end
  union all select 'FUNCTION', 'admin_attempt_stats',
    case when exists (select 1 from pg_proc where proname='admin_attempt_stats')
         then 'OK' else 'ERROR — missing' end
  union all select 'FUNCTION', 'admin_attempt_detail',
    case when exists (select 1 from pg_proc where proname='admin_attempt_detail')
         then 'OK' else 'ERROR — missing' end
  union all select 'FUNCTION', 'student_course_stats()',
    case when exists (select 1 from pg_proc where proname='student_course_stats')
         then 'OK' else 'ERROR — missing' end

  -- ============================================================
  -- 4. TRIGGERS
  -- ============================================================
  union all select 'TRIGGER', 'on_auth_user_created (creates profile on signup)',
    case when exists (select 1 from pg_trigger where tgname='on_auth_user_created')
         then 'OK' else 'ERROR — missing' end
  union all select 'TRIGGER', 'profiles_touch (updates updated_at)',
    case when exists (select 1 from pg_trigger where tgname='profiles_touch')
         then 'OK' else 'ERROR — missing' end

  -- ============================================================
  -- 5. RLS ENABLED
  -- ============================================================
  union all select 'RLS', 'profiles RLS enabled',
    case when (select relrowsecurity from pg_class where relname='profiles')
         then 'OK' else 'ERROR — RLS disabled' end
  union all select 'RLS', 'courses RLS enabled',
    case when (select relrowsecurity from pg_class where relname='courses')
         then 'OK' else 'ERROR — RLS disabled' end
  union all select 'RLS', 'topics RLS enabled',
    case when (select relrowsecurity from pg_class where relname='topics')
         then 'OK' else 'ERROR — RLS disabled' end
  union all select 'RLS', 'questions RLS enabled',
    case when (select relrowsecurity from pg_class where relname='questions')
         then 'OK' else 'ERROR — RLS disabled' end
  union all select 'RLS', 'tokens RLS enabled',
    case when (select relrowsecurity from pg_class where relname='tokens')
         then 'OK' else 'ERROR — RLS disabled' end
  union all select 'RLS', 'exam_attempts RLS enabled',
    case when (select relrowsecurity from pg_class where relname='exam_attempts')
         then 'OK' else 'ERROR — RLS disabled' end
  union all select 'RLS', 'exam_answers RLS enabled',
    case when (select relrowsecurity from pg_class where relname='exam_answers')
         then 'OK' else 'ERROR — RLS disabled' end

  -- ============================================================
  -- 6. RLS POLICIES
  -- ============================================================
  union all select 'POLICY', 'courses_select exists',
    case when exists (select 1 from pg_policies
                      where tablename='courses' and policyname='courses_select')
         then 'OK' else 'ERROR — missing' end
  union all select 'POLICY', 'questions_admin exists',
    case when exists (select 1 from pg_policies
                      where tablename='questions' and policyname='questions_admin')
         then 'OK' else 'ERROR — missing' end

  -- ============================================================
  -- 7. SEED DATA
  -- ============================================================
  union all select 'SEED', 'courses exist',
    case when (select count(*) from courses) > 0
         then 'OK (' || (select count(*) from courses) || ' courses)' 
         else 'ERROR — no courses' end
  union all select 'SEED', 'MTH101 has target_faculties set',
    case when exists (select 1 from courses where code='MTH101' 
                        and coalesce(array_length(target_faculties,1),0) > 0)
         then 'OK' else 'ERROR' end
  union all select 'SEED', 'PHY101 shared between Science + Engineering',
    case when exists (select 1 from courses where code='PHY101'
                        and target_faculties @> array['Science','Engineering'])
         then 'OK' else 'ERROR' end
  union all select 'SEED', 'questions exist (seeded)',
    case when (select count(*) from questions) > 0
         then 'OK (' || (select count(*) from questions) || ' questions)'
         else 'INFO — no questions yet (upload before launch)' end
  union all select 'SEED', 'topics exist',
    case when (select count(*) from topics) > 0
         then 'OK (' || (select count(*) from topics) || ' topics)'
         else 'ERROR — no topics' end

  -- ============================================================
  -- 8. ADMIN ACCOUNT
  -- ============================================================
  union all select 'ADMIN', 'at least 1 super_admin exists',
    case when (select count(*) from profiles where role='super_admin') > 0
         then 'OK (' || (select count(*) from profiles where role='super_admin') || ')'
         else 'ERROR — no admin' end

)
select category, item, status
from checks
order by
  case category
    when 'TABLE' then 1
    when 'COLUMN' then 2
    when 'FUNCTION' then 3
    when 'TRIGGER' then 4
    when 'RLS' then 5
    when 'POLICY' then 6
    when 'SEED' then 7
    when 'ADMIN' then 8
    else 9
  end,
  item;