-- Phase 1: owner dorm management.
-- Rooms get a direct dorm_id (room numbers are unique per dorm, and the owner's
-- room map reads a whole dorm at once), photos remember their storage path so
-- they can be deleted, and a dorm can only be published once it is complete.

-- ---------------------------------------------------------------------------
-- rooms.dorm_id: derived from the room type, never trusted from the client
-- ---------------------------------------------------------------------------
alter table public.rooms add column dorm_id uuid references public.dorms (id) on delete cascade;

update public.rooms r
set dorm_id = rt.dorm_id
from public.room_types rt
where rt.id = r.room_type_id;

alter table public.rooms alter column dorm_id set not null;

create or replace function public.set_room_dorm_id()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select rt.dorm_id into new.dorm_id
  from public.room_types rt
  where rt.id = new.room_type_id;
  return new;
end;
$$;

create trigger rooms_set_dorm_id
before insert or update of room_type_id on public.rooms
for each row execute function public.set_room_dorm_id();

create index rooms_dorm_id_idx on public.rooms (dorm_id);

-- Room numbers are unique within a dorm (case and surrounding spaces ignored).
alter table public.rooms add constraint rooms_room_no_not_blank check (char_length(btrim(room_no)) between 1 and 20);
create unique index rooms_dorm_room_no_key on public.rooms (dorm_id, lower(btrim(room_no)));

-- ---------------------------------------------------------------------------
-- dorm_photos.storage_path: the object key inside the dorm-photos bucket
-- ---------------------------------------------------------------------------
alter table public.dorm_photos add column storage_path text;
create index dorm_photos_dorm_sort_idx on public.dorm_photos (dorm_id, sort_order);

-- Images only, at most 5 MB each (the client compresses well below that).
update storage.buckets
set file_size_limit = 5 * 1024 * 1024,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'dorm-photos';

-- ---------------------------------------------------------------------------
-- Publishing guard: a published dorm must be complete enough to book from
-- ---------------------------------------------------------------------------
create or replace function public.check_dorm_publishable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    if coalesce(btrim(new.address), '') = '' or coalesce(btrim(new.province), '') = '' then
      raise exception 'dorm_not_publishable: address' using errcode = 'P0001';
    end if;
    if not exists (select 1 from public.dorm_photos p where p.dorm_id = new.id) then
      raise exception 'dorm_not_publishable: photos' using errcode = 'P0001';
    end if;
    if not exists (select 1 from public.rooms r where r.dorm_id = new.id) then
      raise exception 'dorm_not_publishable: rooms' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create trigger dorms_check_publishable
before insert or update of status on public.dorms
for each row execute function public.check_dorm_publishable();
