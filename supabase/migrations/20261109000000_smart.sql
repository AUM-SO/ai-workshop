-- Phase 5: smart features.
--   * search_dorms: distance from a destination (commute search)
--   * dorm_view_counts + record_dorm_view + nearby_price_stats: owner insights
--   * PromptPay deposit: dorms.promptpay_id, deposit slip on bookings
--   * roommate_profiles: roommate matching
--   * dorms.ai_reply_enabled: AI answers tenants while the owner is away

-- ---------------------------------------------------------------------------
-- Commute search: same as before plus an optional destination and radius.
-- ---------------------------------------------------------------------------
drop function public.search_dorms(text, text, public.gender_policy, integer, integer, text[], boolean, double precision[], text, integer, integer);

create or replace function public.distance_km(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns double precision
language sql
immutable
set search_path = ''
as $$
  -- Haversine great-circle distance.
  select 6371 * 2 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  ));
$$;

create or replace function public.search_dorms(
  q text default null,
  province_filter text default null,
  gender_filter public.gender_policy default null,
  price_min integer default null,
  price_max integer default null,
  amenity_filter text[] default null,
  vacant_only boolean default false,
  -- [south, west, north, east] in degrees; set by the map view.
  bbox double precision[] default null,
  sort text default 'relevance',
  page_size integer default 20,
  page_offset integer default 0,
  -- Commute search: only dorms within max_km (straight line) of this point.
  near_lat double precision default null,
  near_lng double precision default null,
  max_km double precision default null
)
returns table (
  id uuid,
  name text,
  district text,
  province text,
  lat double precision,
  lng double precision,
  gender_policy public.gender_policy,
  cover_url text,
  amenities text[],
  nearby text[],
  min_price integer,
  max_price integer,
  vacant_rooms integer,
  total_rooms integer,
  updated_at timestamptz,
  distance_km double precision,
  total_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with terms as (
    select coalesce(array_agg(t), '{}') as words
    from unnest(regexp_split_to_array(btrim(coalesce(q, '')), '\s+')) as t
    where t <> ''
  ),
  stats as (
    select
      d.id,
      min(rt.monthly_price) as min_price,
      max(rt.monthly_price) as max_price,
      count(r.id) filter (where r.status = 'vacant')::integer as vacant_rooms,
      count(r.id)::integer as total_rooms
    from public.dorms d
    left join public.room_types rt on rt.dorm_id = d.id
    left join public.rooms r on r.room_type_id = rt.id
    where d.status = 'published'
    group by d.id
  ),
  matched as (
    select d.*, s.min_price, s.max_price, s.vacant_rooms, s.total_rooms,
      (select count(*) from unnest((select words from terms)) w where d.name ilike '%' || w || '%') as name_hits,
      case when near_lat is not null and near_lng is not null and d.lat is not null and d.lng is not null
        then public.distance_km(near_lat, near_lng, d.lat, d.lng) end as dist
    from public.dorms d
    join stats s on s.id = d.id
    where d.status = 'published'
      and (province_filter is null or d.province = province_filter)
      and (gender_filter is null or d.gender_policy = gender_filter)
      and (amenity_filter is null or d.amenities @> amenity_filter)
      and (not vacant_only or s.vacant_rooms > 0)
      and (price_min is null or exists (
        select 1 from public.room_types rt where rt.dorm_id = d.id and rt.monthly_price >= price_min
          and (price_max is null or rt.monthly_price <= price_max)))
      and (price_max is null or exists (
        select 1 from public.room_types rt where rt.dorm_id = d.id and rt.monthly_price <= price_max))
      and (bbox is null or (
        d.lat between bbox[1] and bbox[3] and d.lng between bbox[2] and bbox[4]))
      and not exists (
        select 1 from unnest((select words from terms)) w
        where concat_ws(' ', d.name, d.address, d.district, d.province, d.description, array_to_string(d.nearby, ' '))
          not ilike '%' || w || '%'
      )
  )
  select
    m.id, m.name, m.district, m.province, m.lat, m.lng, m.gender_policy, m.cover_url,
    m.amenities, m.nearby, m.min_price, m.max_price, m.vacant_rooms, m.total_rooms, m.updated_at,
    m.dist as distance_km,
    count(*) over () as total_count
  from matched m
  where max_km is null or near_lat is null or (m.dist is not null and m.dist <= max_km)
  order by
    case when sort = 'distance' then m.dist end asc nulls last,
    case when sort = 'price_asc' then m.min_price end asc nulls last,
    case when sort = 'price_desc' then m.min_price end desc nulls last,
    case when sort = 'vacant' then m.vacant_rooms end desc,
    case when sort = 'relevance' then m.name_hits end desc,
    m.dist asc nulls last,
    m.updated_at desc
  limit least(greatest(page_size, 1), 50)
  offset greatest(page_offset, 0);
$$;

grant execute on function public.search_dorms to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Owner insights
-- ---------------------------------------------------------------------------
create table public.dorm_view_counts (
  dorm_id uuid not null references public.dorms (id) on delete cascade,
  day date not null default ((now() at time zone 'Asia/Bangkok')::date),
  views integer not null default 0,
  primary key (dorm_id, day)
);

alter table public.dorm_view_counts enable row level security;

create policy "owners read their view counts"
  on public.dorm_view_counts for select
  to authenticated
  using (public.owns_dorm(dorm_id));

-- Called once per page view from the browser. Counts only published dorms.
create or replace function public.record_dorm_view(target_dorm_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.dorm_view_counts as c (dorm_id, day, views)
  select d.id, (now() at time zone 'Asia/Bangkok')::date, 1
  from public.dorms d where d.id = target_dorm_id and d.status = 'published'
  on conflict (dorm_id, day) do update set views = c.views + 1;
$$;
grant execute on function public.record_dorm_view to anon, authenticated;

-- Starting prices of other published dorms near a dorm, for price comparison.
create or replace function public.nearby_price_stats(target_dorm_id uuid, radius_km double precision default 3)
returns table (dorm_count integer, avg_min_price integer, min_min_price integer, max_min_price integer)
language sql
stable
security invoker
set search_path = ''
as $$
  with me as (select lat, lng from public.dorms where id = target_dorm_id),
  others as (
    select (select min(rt.monthly_price) from public.room_types rt where rt.dorm_id = d.id) as price
    from public.dorms d, me
    where d.status = 'published' and d.id <> target_dorm_id
      and d.lat is not null and me.lat is not null
      and public.distance_km(me.lat, me.lng, d.lat, d.lng) <= radius_km
  )
  select count(price)::integer, round(avg(price))::integer, min(price)::integer, max(price)::integer
  from others where price is not null;
$$;
grant execute on function public.nearby_price_stats to authenticated;

-- ---------------------------------------------------------------------------
-- PromptPay deposit
-- ---------------------------------------------------------------------------
alter table public.dorms
  add column promptpay_id text check (promptpay_id ~ '^(0\d{9}|\d{13})$'),
  add column ai_reply_enabled boolean not null default false;

alter table public.bookings
  add column deposit_amount integer check (deposit_amount >= 0),
  add column deposit_slip_path text,
  add column deposit_submitted_at timestamptz,
  add column deposit_confirmed_at timestamptz;

-- The tenant attaches a transfer slip once the owner has held or confirmed the room.
create or replace function public.submit_deposit_slip(target_booking_id uuid, slip_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  b record;
  amount integer;
begin
  select * into b from public.bookings where id = target_booking_id;
  if b.id is null or b.tenant_id <> auth.uid() then
    raise exception 'not_allowed';
  end if;
  if b.status not in ('held', 'confirmed') then
    raise exception 'booking_not_ready_for_deposit';
  end if;
  if b.deposit_confirmed_at is not null then
    raise exception 'deposit_already_confirmed';
  end if;
  if (storage.foldername(slip_path))[1] <> auth.uid()::text or (storage.foldername(slip_path))[2] <> b.id::text then
    raise exception 'bad_slip_path';
  end if;
  select deposit into amount from public.room_types where id = b.room_type_id;

  update public.bookings
  set deposit_slip_path = slip_path, deposit_submitted_at = now(), deposit_amount = amount
  where id = b.id;

  insert into public.messages (conversation_id, sender_id, kind, body, booking_id)
  values (b.conversation_id, b.tenant_id, 'system', 'ผู้เช่าแนบสลิปเงินมัดจำแล้ว รอเจ้าของหอตรวจสอบ', b.id);
  perform public.notify(b.owner_id, 'deposit', 'ผู้เช่าแนบสลิปเงินมัดจำ', 'ตรวจสอบยอดเงินแล้วกดยืนยันในแชท', '/chat/' || b.conversation_id);
end;
$$;
revoke execute on function public.submit_deposit_slip from public, anon;
grant execute on function public.submit_deposit_slip to authenticated;

create or replace function public.confirm_deposit(target_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  b record;
begin
  select * into b from public.bookings where id = target_booking_id;
  if b.id is null or b.owner_id <> auth.uid() then
    raise exception 'not_allowed';
  end if;
  if b.deposit_submitted_at is null then
    raise exception 'no_deposit_slip';
  end if;
  update public.bookings set deposit_confirmed_at = now() where id = b.id and deposit_confirmed_at is null;

  insert into public.messages (conversation_id, sender_id, kind, body, booking_id)
  values (b.conversation_id, b.owner_id, 'system', 'เจ้าของหอยืนยันว่าได้รับเงินมัดจำแล้ว', b.id);
  perform public.notify(b.tenant_id, 'deposit', 'เจ้าของหอได้รับเงินมัดจำแล้ว', null, '/chat/' || b.conversation_id);
end;
$$;
revoke execute on function public.confirm_deposit from public, anon;
grant execute on function public.confirm_deposit to authenticated;

-- Slips: {tenant_id}/{booking_id}/{file}. The tenant and the booking's owner can read.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('deposit-slips', 'deposit-slips', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "tenants upload deposit slips"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'deposit-slips'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "tenants and owners read deposit slips"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'deposit-slips'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (
        select 1 from public.bookings b
        where b.id::text = (storage.foldername(name))[2] and b.owner_id = (select auth.uid())
      )
    )
  );

-- ---------------------------------------------------------------------------
-- Roommate matching
-- ---------------------------------------------------------------------------
create table public.roommate_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  active boolean not null default true,
  province text not null,
  budget_max integer not null check (budget_max between 1000 and 100000),
  gender text not null check (gender in ('male', 'female', 'other')),
  prefer_same_gender boolean not null default true,
  sleep text not null check (sleep in ('early', 'late', 'flexible')),
  cleanliness smallint not null check (cleanliness between 1 and 3),
  smoking boolean not null default false,
  pets boolean not null default false,
  guests text not null check (guests in ('rarely', 'sometimes', 'often')),
  bio text check (char_length(bio) <= 500),
  contact text check (char_length(contact) <= 100),
  updated_at timestamptz not null default now()
);

create trigger roommate_profiles_set_updated_at
before update on public.roommate_profiles
for each row execute function public.set_updated_at();

alter table public.roommate_profiles enable row level security;

create policy "signed-in users browse active roommate profiles"
  on public.roommate_profiles for select
  to authenticated
  using (active or user_id = (select auth.uid()));

create policy "users create their roommate profile"
  on public.roommate_profiles for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "users update their roommate profile"
  on public.roommate_profiles for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "users delete their roommate profile"
  on public.roommate_profiles for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- AI replies are posted as the owner but must not mark the chat read for them.
-- ---------------------------------------------------------------------------
create or replace function public.touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations
  set last_message_at = new.created_at,
      tenant_last_read_at = case when new.sender_id = tenant_id and new.via is null then new.created_at else tenant_last_read_at end,
      owner_last_read_at = case when new.sender_id = owner_id and new.via is null then new.created_at else owner_last_read_at end
  where id = new.conversation_id;
  return new;
end;
$$;
