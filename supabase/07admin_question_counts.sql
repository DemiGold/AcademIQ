create or replace function admin_question_counts()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_by_course jsonb;
  v_by_topic  jsonb;
begin
  if not is_admin() then raise exception 'forbidden'; end if;

  select coalesce(jsonb_object_agg(course_id::text, cnt), '{}'::jsonb)
  into v_by_course
  from (
    select course_id, count(*)::int as cnt
    from questions
    group by course_id
  ) t;

  select coalesce(jsonb_object_agg(topic_id::text, cnt), '{}'::jsonb)
  into v_by_topic
  from (
    select topic_id, count(*)::int as cnt
    from questions
    where topic_id is not null
    group by topic_id
  ) t;

  return jsonb_build_object('by_course', v_by_course, 'by_topic', v_by_topic);
end $$;

revoke execute on function admin_question_counts() from public, anon;
grant  execute on function admin_question_counts() to authenticated;