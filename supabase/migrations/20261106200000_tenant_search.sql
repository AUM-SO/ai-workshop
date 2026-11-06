-- Phase 2: tenant search.
-- Owners can list nearby places (universities, stations, landmarks) so tenants find
-- dorms by the place they care about, and search_dorms() does filtering, paging and
-- price/vacancy summaries in one query. It runs as the caller, so RLS still limits
-- results to published dorms.

alter table public.dorms
  add column nearby text[] not null default '{}'
  check (cardinality(nearby) <= 15);

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
  page_offset integer default 0
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
  total_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with terms as (
    -- Every word of the query must match somewhere (name, address, area or nearby places).
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
      -- Name matches rank above matches in the address or nearby places.
      (select count(*) from unnest((select words from terms)) w where d.name ilike '%' || w || '%') as name_hits
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
    count(*) over () as total_count
  from matched m
  order by
    case when sort = 'price_asc' then m.min_price end asc nulls last,
    case when sort = 'price_desc' then m.min_price end desc nulls last,
    case when sort = 'vacant' then m.vacant_rooms end desc,
    case when sort = 'relevance' then m.name_hits end desc,
    m.updated_at desc
  limit least(greatest(page_size, 1), 50)
  offset greatest(page_offset, 0);
$$;

grant execute on function public.search_dorms to anon, authenticated;
