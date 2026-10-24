-- ============================================================
-- ACADEMIQ — RESET EVERYTHING
-- Deletes ALL data but keeps schema, RPCs, and your admin account.
-- ============================================================

begin;

-- Delete all exam data
delete from exam_answers;
delete from exam_attempts;

-- Delete all tokens
delete from tokens;
delete from token_attempts;

-- Delete all content
delete from questions;
delete from topics;
delete from courses;

-- Delete all non-admin users (cascades to their profiles)
delete from auth.users
where id not in (select id from profiles where role = 'super_admin');

-- Verify
select 'courses' as table_name, count(*) from courses
union all select 'topics', count(*) from topics
union all select 'questions', count(*) from questions
union all select 'tokens', count(*) from tokens
union all select 'students', count(*) from profiles where role = 'student'
union all select 'attempts', count(*) from exam_attempts;

commit;