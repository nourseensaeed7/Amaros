-- Unsigned bookings hold their dates for 2 hours only.
-- create-reservation sets hold_expires_at; rows from before this change keep
-- NULL and are never expired automatically.
alter table public.reservations add column if not exists hold_expires_at timestamptz;

create extension if not exists pg_cron;

-- Every 5 minutes: free the dates of bookings that were never signed.
-- (The status change is ignored by send-contract, so no email goes out.)
select cron.schedule(
  'expire-unsigned-bookings',
  '*/5 * * * *',
  $$update public.reservations
      set contract_status = 'expired'
    where contract_status in ('pending', 'sent')
      and hold_expires_at < now()$$
);

-- Expired bookings no longer block the calendar (same list as
-- RELEASED_STATUSES in create-reservation).
create or replace function public.reserved_dates(p_car_id bigint)
returns table (start_date date, end_date date)
language sql stable security definer set search_path = public as $$
  select r.start_date::date, r.end_date::date
  from reservations r
  where r.car_id = p_car_id
    and r.end_date >= current_date
    and coalesce(r.contract_status, '') not in ('cancelled', 'rejected', 'expired')
$$;
