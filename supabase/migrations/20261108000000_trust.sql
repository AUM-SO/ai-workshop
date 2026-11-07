-- Phase 4: trust and engagement.
--   * room_type_watches: "notify me when a room is free" per room type (one-shot)
--   * reviews: only tenants with a confirmed booking can review, once per booking
--   * reports: anyone signed in can report a listing; admins resolve them
--   * owner_verifications: owners upload a document, admins approve -> profiles.verified_at
--   * line_links: connect a LINE account for push notifications

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;

-- auth.role() reads the JWT, so it is also 'authenticated' inside security-definer
-- functions. current_user is the real database role, which lets trusted functions
-- (e.g. review_verification) change protected fields while clients still cannot.
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'authenticated' then
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

-- Admins can moderate any listing (e.g. archive a reported dorm).
create policy "admins update any dorm"
  on public.dorms for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "admins read any dorm"
  on public.dorms for select
  to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Waitlist
-- ---------------------------------------------------------------------------
create table public.room_type_watches (
  user_id uuid not null references public.profiles (id) on delete cascade,
  room_type_id uuid not null references public.room_types (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, room_type_id)
);
create index room_type_watches_type_idx on public.room_type_watches (room_type_id);

alter table public.room_type_watches enable row level security;

create policy "users see their own watches"
  on public.room_type_watches for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "users watch published room types"
  on public.room_type_watches for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.room_types t
      where t.id = room_type_id and public.dorm_is_published(t.dorm_id)
    )
  );

create policy "users stop watching"
  on public.room_type_watches for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- When a room becomes vacant, tell everyone waiting for that room type, once.
create or replace function public.notify_room_watchers()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  w record;
  type_name text;
  dorm_name text;
begin
  if new.status <> 'vacant' or old.status = 'vacant' or new.room_type_id is null then
    return new;
  end if;
  select t.name, d.name into type_name, dorm_name
  from public.room_types t join public.dorms d on d.id = t.dorm_id
  where t.id = new.room_type_id and d.status = 'published';
  if dorm_name is null then return new; end if;

  for w in delete from public.room_type_watches where room_type_id = new.room_type_id returning user_id loop
    perform public.notify(
      w.user_id, 'room_available', 'มีห้องว่างแล้วที่ ' || dorm_name,
      type_name || ' ว่าง 1 ห้อง รีบทักเจ้าของหอก่อนมีคนจอง', '/dorms/' || new.dorm_id
    );
  end loop;
  return new;
end;
$$;

create trigger rooms_notify_watchers
after update of status on public.rooms
for each row execute function public.notify_room_watchers();

-- ---------------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  dorm_id uuid not null references public.dorms (id) on delete cascade,
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  tenant_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text check (char_length(body) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index reviews_dorm_idx on public.reviews (dorm_id, created_at desc);

create trigger reviews_set_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

alter table public.reviews enable row level security;

create policy "reviews of published dorms are public"
  on public.reviews for select
  using (public.dorm_is_published(dorm_id) or tenant_id = (select auth.uid()));

create policy "tenants review confirmed bookings"
  on public.reviews for insert
  to authenticated
  with check (
    tenant_id = (select auth.uid())
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id and b.tenant_id = (select auth.uid())
        and b.dorm_id = reviews.dorm_id and b.status = 'confirmed'
    )
  );

create policy "tenants edit their reviews"
  on public.reviews for update
  to authenticated
  using (tenant_id = (select auth.uid()))
  with check (tenant_id = (select auth.uid()));

create policy "tenants delete their reviews"
  on public.reviews for delete
  to authenticated
  using (tenant_id = (select auth.uid()) or (select public.is_admin()));

-- dorm_id, booking_id and tenant_id never move after insert.
create or replace function public.protect_review_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.dorm_id <> old.dorm_id or new.booking_id <> old.booking_id or new.tenant_id <> old.tenant_id then
    raise exception 'review_fields_locked';
  end if;
  return new;
end;
$$;

create trigger reviews_protect_fields
before update on public.reviews
for each row execute function public.protect_review_fields();

-- ---------------------------------------------------------------------------
-- Reports
-- ---------------------------------------------------------------------------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  dorm_id uuid not null references public.dorms (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null check (reason in ('scam', 'wrong_info', 'unavailable', 'other')),
  details text check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index reports_open_idx on public.reports (status, created_at desc);

alter table public.reports enable row level security;

create policy "reporters and admins read reports"
  on public.reports for select
  to authenticated
  using (reporter_id = (select auth.uid()) or (select public.is_admin()));

create policy "signed-in users report published dorms"
  on public.reports for insert
  to authenticated
  with check (reporter_id = (select auth.uid()) and status = 'open' and public.dorm_is_published(dorm_id));

create policy "admins resolve reports"
  on public.reports for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Owner verification
-- ---------------------------------------------------------------------------
create table public.owner_verifications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  document_path text not null,
  note text check (char_length(note) <= 500),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewer_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index owner_verifications_owner_idx on public.owner_verifications (owner_id, created_at desc);
-- One request in review at a time per owner.
create unique index owner_verifications_one_pending on public.owner_verifications (owner_id) where status = 'pending';

alter table public.owner_verifications enable row level security;

create policy "owners and admins read verifications"
  on public.owner_verifications for select
  to authenticated
  using (owner_id = (select auth.uid()) or (select public.is_admin()));

create policy "owners request verification"
  on public.owner_verifications for insert
  to authenticated
  with check (
    owner_id = (select auth.uid())
    and status = 'pending'
    and (select public.is_owner())
    and (storage.foldername(document_path))[1] = (select auth.uid())::text
  );

create or replace function public.review_verification(target_id uuid, approve boolean, message text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v record;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  update public.owner_verifications
  set status = case when approve then 'approved' else 'rejected' end,
      reviewer_note = nullif(btrim(message), ''),
      reviewed_at = now()
  where id = target_id and status = 'pending'
  returning * into v;
  if v.id is null then
    raise exception 'verification_not_pending';
  end if;

  if approve then
    update public.profiles set verified_at = now() where id = v.owner_id;
    perform public.notify(v.owner_id, 'verification', 'ยืนยันตัวตนเจ้าของหอสำเร็จ', 'หอของคุณจะแสดงป้าย Verified', '/owner/verify');
  else
    perform public.notify(v.owner_id, 'verification', 'คำขอยืนยันตัวตนไม่ผ่าน', coalesce(nullif(btrim(message), ''), 'กรุณาส่งเอกสารใหม่'), '/owner/verify');
  end if;
end;
$$;
revoke execute on function public.review_verification from public, anon;
grant execute on function public.review_verification to authenticated;

-- Private bucket: owners upload into their own folder, only they and admins can read.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('verification-docs', 'verification-docs', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

create policy "owners upload verification documents"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'verification-docs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "owners and admins read verification documents"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'verification-docs'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin()))
  );

-- ---------------------------------------------------------------------------
-- LINE
-- ---------------------------------------------------------------------------
-- Written only by trusted code: the link code by create_line_link_code(), the
-- LINE user id by the webhook with the service key.
create table public.line_links (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  link_code text unique,
  line_user_id text unique,
  linked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.line_links enable row level security;

create policy "users see their own LINE link"
  on public.line_links for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "users unlink LINE"
  on public.line_links for delete
  to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.create_line_link_code()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  code text := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;
  insert into public.line_links (user_id, link_code)
  values (auth.uid(), code)
  on conflict (user_id) do update set link_code = excluded.link_code;
  return code;
end;
$$;
revoke execute on function public.create_line_link_code from public, anon;
grant execute on function public.create_line_link_code to authenticated;


-- Notifications already pushed to LINE (set by the server with the service key).
alter table public.notifications add column line_sent_at timestamptz;
