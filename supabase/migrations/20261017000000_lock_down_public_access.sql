-- Lock down anonymous access. The website now reaches customers, reservations
-- and the contracts bucket only through edge functions (service role).
-- Apply BEFORE deploying the new frontend (it calls reserved_dates()).

-- ── Calendar: expose only booked dates, not reservation rows ────────────────
create or replace function public.reserved_dates(p_car_id bigint)
returns table (start_date date, end_date date)
language sql stable security definer set search_path = public as $$
  select r.start_date::date, r.end_date::date
  from reservations r
  where r.car_id = p_car_id and r.end_date >= current_date
$$;
revoke all on function public.reserved_dates(bigint) from public;
grant execute on function public.reserved_dates(bigint) to anon, authenticated;

-- ── Tables: RLS on, no anon/public policies ────────────────────────────────
alter table public.customers    enable row level security;
alter table public.reservations enable row level security;

do $$
declare p record;
begin
  -- Policies were created in the dashboard, so drop them by what they grant.
  for p in
    select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('customers', 'reservations')
      and roles && array['anon', 'public']::name[]
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;

  -- contracts bucket: no anonymous access at all.
  -- files bucket: anonymous may only INSERT (re-added below), never read/change.
  for p in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and roles && array['anon', 'public']::name[]
      and (
        coalesce(qual, '') || coalesce(with_check, '') like '%''contracts''%'
        or coalesce(qual, '') || coalesce(with_check, '') like '%''files''%'
      )
  loop
    execute format('drop policy %I on storage.objects', p.policyname);
  end loop;
end $$;

drop policy if exists "anon upload booking documents" on storage.objects;
create policy "anon upload booking documents" on storage.objects
  for insert to anon
  with check (
    bucket_id = 'files'
    and name ~ '^(license_front|license_back|id_front|id_back)/[0-9a-f-]{36}\.[a-z0-9]{1,5}$'
  );

update storage.buckets set public = false where id in ('contracts', 'files');
update storage.buckets
  set file_size_limit    = 10485760, -- 10 MB
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']
  where id = 'files';
update storage.buckets
  set allowed_mime_types = array['application/pdf']
  where id = 'contracts';
