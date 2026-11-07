-- Self-service account deletion (PDPA). Deleting the auth user cascades to the
-- profile and everything that references it. Owners must first take their dorms
-- offline and close open bookings, so tenants are not left mid-booking.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'not_signed_in';
  end if;
  if exists (select 1 from public.dorms where owner_id = me and status = 'published') then
    raise exception 'has_published_dorms';
  end if;
  if exists (
    select 1 from public.bookings
    where (owner_id = me or tenant_id = me) and status in ('pending', 'held')
  ) then
    raise exception 'has_open_bookings';
  end if;
  delete from auth.users where id = me;
end;
$$;
revoke execute on function public.delete_my_account from public, anon;
grant execute on function public.delete_my_account to authenticated;
