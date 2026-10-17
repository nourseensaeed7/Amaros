-- Cancelled/rejected bookings free their dates again, in the calendar and in
-- create-reservation's availability check (RELEASED_STATUSES there).
create or replace function public.reserved_dates(p_car_id bigint)
returns table (start_date date, end_date date)
language sql stable security definer set search_path = public as $$
  select r.start_date::date, r.end_date::date
  from reservations r
  where r.car_id = p_car_id
    and r.end_date >= current_date
    and coalesce(r.contract_status, '') not in ('cancelled', 'rejected')
$$;
