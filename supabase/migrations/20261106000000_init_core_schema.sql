-- Core schema for Phase 0: profiles, dorms, photos, room types and rooms.
-- Every table has Row Level Security enabled. Public visitors can read
-- published dorms; only the owning user can write to their own dorms.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('tenant', 'owner', 'admin');
create type public.dorm_status as enum ('draft', 'published', 'archived');
create type public.gender_policy as enum ('male', 'female', 'mixed');
create type public.room_status as enum ('vacant', 'held', 'occupied', 'maintenance');

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'tenant',
  display_name text,
  avatar_url text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Create a profile when a user signs up. The role comes from sign-up
-- metadata, but only 'tenant' or 'owner' may be self-assigned.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
begin
  insert into public.profiles (id, role, display_name, avatar_url)
  values (
    new.id,
    case when requested_role = 'owner' then 'owner'::public.user_role else 'tenant'::public.user_role end,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Users may not promote themselves to admin or mark themselves verified.
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.role()) = 'authenticated' then
    if new.role = 'admin' and old.role <> 'admin' then
      raise exception 'cannot assign admin role';
    end if;
    if new.verified_at is distinct from old.verified_at then
      raise exception 'cannot change verification status';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_fields
before update on public.profiles
for each row execute function public.protect_profile_fields();

-- ---------------------------------------------------------------------------
-- dorms: a "project" created by an owner
-- ---------------------------------------------------------------------------
create table public.dorms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text,
  address text,
  district text,
  province text,
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  gender_policy public.gender_policy not null default 'mixed',
  amenities text[] not null default '{}',
  rules text,
  cover_url text,
  status public.dorm_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index dorms_owner_id_idx on public.dorms (owner_id);
create index dorms_status_idx on public.dorms (status);

create trigger dorms_set_updated_at
before update on public.dorms
for each row execute function public.set_updated_at();

create table public.dorm_photos (
  id uuid primary key default gen_random_uuid(),
  dorm_id uuid not null references public.dorms (id) on delete cascade,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index dorm_photos_dorm_id_idx on public.dorm_photos (dorm_id);

-- ---------------------------------------------------------------------------
-- room_types and rooms
-- ---------------------------------------------------------------------------
create table public.room_types (
  id uuid primary key default gen_random_uuid(),
  dorm_id uuid not null references public.dorms (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  size_sqm numeric(6, 2) check (size_sqm > 0),
  monthly_price integer not null check (monthly_price >= 0),
  deposit integer not null default 0 check (deposit >= 0),
  advance_months smallint not null default 1 check (advance_months >= 0),
  water_rate numeric(8, 2),          -- baht per unit, or flat if water_flat is set
  water_flat integer,                -- flat monthly water fee, when not metered
  electric_rate numeric(8, 2),       -- baht per kWh
  other_fees jsonb not null default '[]',  -- [{ "label": "...", "amount": 0, "monthly": true }]
  furniture text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index room_types_dorm_id_idx on public.room_types (dorm_id);

create trigger room_types_set_updated_at
before update on public.room_types
for each row execute function public.set_updated_at();

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  room_type_id uuid not null references public.room_types (id) on delete cascade,
  room_no text not null,
  floor smallint not null default 1,
  status public.room_status not null default 'vacant',
  held_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index rooms_room_type_id_idx on public.rooms (room_type_id);

create trigger rooms_set_updated_at
before update on public.rooms
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Ownership helpers used by RLS (security definer avoids recursive policies)
-- ---------------------------------------------------------------------------
create or replace function public.owns_dorm(target_dorm_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.dorms d
    where d.id = target_dorm_id and d.owner_id = (select auth.uid())
  );
$$;

create or replace function public.dorm_is_published(target_dorm_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.dorms d
    where d.id = target_dorm_id and d.status = 'published'
  );
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('owner', 'admin')
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.dorms enable row level security;
alter table public.dorm_photos enable row level security;
alter table public.room_types enable row level security;
alter table public.rooms enable row level security;

-- profiles: public display info is readable; users edit only themselves.
create policy "profiles are readable by everyone"
  on public.profiles for select
  using (true);

create policy "users update their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- dorms
create policy "published dorms are public"
  on public.dorms for select
  using (status = 'published' or owner_id = (select auth.uid()));

create policy "owners create their own dorms"
  on public.dorms for insert
  to authenticated
  with check (owner_id = (select auth.uid()) and public.is_owner());

create policy "owners update their own dorms"
  on public.dorms for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "owners delete their own dorms"
  on public.dorms for delete
  to authenticated
  using (owner_id = (select auth.uid()));

-- dorm_photos
create policy "photos of visible dorms are public"
  on public.dorm_photos for select
  using (public.dorm_is_published(dorm_id) or public.owns_dorm(dorm_id));

create policy "owners manage photos"
  on public.dorm_photos for all
  to authenticated
  using (public.owns_dorm(dorm_id))
  with check (public.owns_dorm(dorm_id));

-- room_types
create policy "room types of visible dorms are public"
  on public.room_types for select
  using (public.dorm_is_published(dorm_id) or public.owns_dorm(dorm_id));

create policy "owners manage room types"
  on public.room_types for all
  to authenticated
  using (public.owns_dorm(dorm_id))
  with check (public.owns_dorm(dorm_id));

-- rooms (ownership goes through room_types)
create policy "rooms of visible dorms are public"
  on public.rooms for select
  using (
    exists (
      select 1 from public.room_types rt
      where rt.id = room_type_id
        and (public.dorm_is_published(rt.dorm_id) or public.owns_dorm(rt.dorm_id))
    )
  );

create policy "owners manage rooms"
  on public.rooms for all
  to authenticated
  using (
    exists (select 1 from public.room_types rt where rt.id = room_type_id and public.owns_dorm(rt.dorm_id))
  )
  with check (
    exists (select 1 from public.room_types rt where rt.id = room_type_id and public.owns_dorm(rt.dorm_id))
  );

-- Live Room Map: stream room status changes to subscribed clients.
alter publication supabase_realtime add table public.rooms;

-- ---------------------------------------------------------------------------
-- Storage: public bucket for dorm photos, one folder per user id
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('dorm-photos', 'dorm-photos', true)
on conflict (id) do nothing;

create policy "dorm photos are public"
  on storage.objects for select
  using (bucket_id = 'dorm-photos');

create policy "owners upload to their own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'dorm-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "owners delete their own photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'dorm-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
