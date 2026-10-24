-- ============================================
-- ADMIN: ATTEMPTS LIST + STATS
-- ============================================

create or replace function admin_list_attempts(
  p_search text default null,
  p_course_id uuid default null,
  p_min_score int default null,
  p_max_score int default null,
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
  from exam_attempts a
  join profiles p on p.id = a.user_id
  join courses c on c.id = a.course_id
  where (p_search is null or p.username ilike v_like or p.full_name ilike v_like)
    and (p_course_id is null or a.course_id = p_course_id)
    and (p_min_score is null or a.score_percent >= p_min_score)
    and (p_max_score is null or a.score_percent <= p_max_score);

  select coalesce(jsonb_agg(r order by r.created_at desc), '[]'::jsonb) into v_rows
  from (
    select a.id,
           a.score_percent,
           a.correct_count,
           a.total_questions,
           a.created_at,
           a.course_id,
           c.code as course_code,
           c.name as course_name,
           p.id as user_id,
           p.username,
           p.full_name
    from exam_attempts a
    join profiles p on p.id = a.user_id
    join courses c on c.id = a.course_id
    where (p_search is null or p.username ilike v_like or p.full_name ilike v_like)
      and (p_course_id is null or a.course_id = p_course_id)
      and (p_min_score is null or a.score_percent >= p_min_score)
      and (p_max_score is null or a.score_percent <= p_max_score)
    order by a.created_at desc
    limit least(greatest(p_limit, 1), 200) offset greatest(p_offset, 0)
  ) r;

  return jsonb_build_object('total', v_total, 'rows', v_rows);
end $$;

create or replace function admin_attempt_stats()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_total int;
  v_avg numeric;
  v_pass int;
  v_unique_users int;
begin
  if not is_admin() then raise exception 'forbidden'; end if;

  select count(*),
         coalesce(round(avg(score_percent), 1), 0),
         count(*) filter (where score_percent >= 50),
         count(distinct user_id)
  into v_total, v_avg, v_pass, v_unique_users
  from exam_attempts;

  return jsonb_build_object(
    'total_attempts', v_total,
    'average_score', v_avg,
    'pass_count', v_pass,
    'pass_rate', case when v_total > 0 then round(100.0 * v_pass / v_total) else 0 end,
    'unique_students', v_unique_users
  );
end $$;

create or replace function admin_attempt_detail(p_attempt_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_result jsonb;
begin
  if not is_admin() then raise exception 'forbidden'; end if;

  select jsonb_build_object(
    'attempt', jsonb_build_object(
      'id', a.id,
      'score_percent', a.score_percent,
      'correct_count', a.correct_count,
      'total_questions', a.total_questions,
      'created_at', a.created_at,
      'course_code', c.code,
      'course_name', c.name,
      'username', p.username,
      'full_name', p.full_name
    ),
    'answers', coalesce(
      (select jsonb_agg(jsonb_build_object(
        'id', ea.id,
        'selected_index', ea.selected_index,
        'is_correct', ea.is_correct,
        'question_text', q.question_text,
        'options', q.options,
        'correct_index', q.correct_index,
        'explanation', q.explanation
      ) order by ea.created_at)
      from exam_answers ea
      join questions q on q.id = ea.question_id
      where ea.attempt_id = a.id),
      '[]'::jsonb
    )
  )
  into v_result
  from exam_attempts a
  join profiles p on p.id = a.user_id
  join courses c on c.id = a.course_id
  where a.id = p_attempt_id;

  return v_result;
end $$;

revoke execute on function admin_list_attempts(text, uuid, int, int, int, int) from public, anon;
revoke execute on function admin_attempt_stats() from public, anon;
revoke execute on function admin_attempt_detail(uuid) from public, anon;
grant  execute on function admin_list_attempts(text, uuid, int, int, int, int) to authenticated;
grant  execute on function admin_attempt_stats() to authenticated;
grant  execute on function admin_attempt_detail(uuid) to authenticated;