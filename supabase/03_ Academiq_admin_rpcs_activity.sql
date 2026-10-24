-- ------------------------------------------------------------
-- ADMIN: RECENT ACTIVITY + SIGNUPS TIMESERIES (corrected)
-- Replaces the earlier pasted block. Safe to re-run.
-- ------------------------------------------------------------

create or replace function admin_recent_activity()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_activations jsonb;
  v_signups jsonb;
begin
  if not is_admin() then raise exception 'forbidden'; end if;

  select coalesce(jsonb_agg(x order by x.at desc), '[]'::jsonb) into v_activations
  from (
    select u.email::text as email, t.used_at as at, t.token_code
    from tokens t
    left join auth.users u on u.id = t.used_by
    where t.is_used and t.used_at is not null
    order by t.used_at desc
    limit 5
  ) x;

  select coalesce(jsonb_agg(x order by x.at desc), '[]'::jsonb) into v_signups
  from (
    select p.username, u.email::text as email, p.created_at as at
    from profiles p
    join auth.users u on u.id = p.id
    where p.role = 'student'
    order by p.created_at desc
    limit 5
  ) x;

  return jsonb_build_object(
    'recent_activations', v_activations,
    'recent_signups', v_signups
  );
end $$;

-- Daily student signups for the last p_days days (1-365), bucketed in Lagos time.
create or replace function admin_signups_series(p_days int default 30)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_days   int  := least(greatest(coalesce(p_days, 30), 1), 365);
  v_today  date := (now() at time zone 'Africa/Lagos')::date;
  v_result jsonb;
begin
  if not is_admin() then raise exception 'forbidden'; end if;

  select coalesce(
           jsonb_agg(
             jsonb_build_object('day', to_char(d.day, 'Mon DD'),
                                'count', coalesce(c.cnt, 0))
             order by d.day
           ), '[]'::jsonb)
  into v_result
  from (
    select v_today - (v_days - 1) + i as day
    from generate_series(0, v_days - 1) as i
  ) d
  left join (
    select (created_at at time zone 'Africa/Lagos')::date as day,
           count(*)::int as cnt
    from profiles
    where role = 'student'
      and created_at >= ((v_today - (v_days - 1))::timestamp at time zone 'Africa/Lagos')
    group by 1
  ) c on c.day = d.day;

  return v_result;
end $$;

revoke execute on function admin_recent_activity()      from public, anon;
revoke execute on function admin_signups_series(int)    from public, anon;
grant  execute on function admin_recent_activity()      to authenticated;
grant  execute on function admin_signups_series(int)    to authenticated;