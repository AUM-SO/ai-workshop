-- Phase 3: Chat-to-Book.
-- One conversation per tenant and dorm; messages are text, booking cards or system notes.
-- Booking state changes go through security-definer functions so the booking, the room
-- status and the chat stay in step, and only the right person can make each move.

create type public.message_kind as enum ('text', 'booking', 'system');
create type public.booking_status as enum ('pending', 'held', 'confirmed', 'declined', 'cancelled', 'expired');

-- ---------------------------------------------------------------------------
-- Conversations
-- ---------------------------------------------------------------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  dorm_id uuid not null references public.dorms (id) on delete cascade,
  tenant_id uuid not null references public.profiles (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  last_message_at timestamptz not null default now(),
  tenant_last_read_at timestamptz not null default now(),
  owner_last_read_at timestamptz not null default to_timestamp(0),
  created_at timestamptz not null default now(),
  unique (dorm_id, tenant_id),
  check (tenant_id <> owner_id)
);
create index conversations_tenant_idx on public.conversations (tenant_id, last_message_at desc);
create index conversations_owner_idx on public.conversations (owner_id, last_message_at desc);

-- The owner always comes from the dorm, never from the client.
create or replace function public.set_conversation_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select d.owner_id into new.owner_id from public.dorms d where d.id = new.dorm_id and d.status = 'published';
  if new.owner_id is null then
    raise exception 'dorm_not_available' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger conversations_set_owner
before insert on public.conversations
for each row execute function public.set_conversation_owner();

create or replace function public.is_participant(target_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.conversations c
    where c.id = target_conversation_id
      and (select auth.uid()) in (c.tenant_id, c.owner_id)
  );
$$;

-- ---------------------------------------------------------------------------
-- Bookings
-- ---------------------------------------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  dorm_id uuid not null references public.dorms (id) on delete cascade,
  room_type_id uuid not null references public.room_types (id) on delete cascade,
  room_id uuid references public.rooms (id) on delete set null,
  tenant_id uuid not null references public.profiles (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  move_in_date date not null,
  months smallint not null check (months between 1 and 60),
  note text check (char_length(note) <= 500),
  status public.booking_status not null default 'pending',
  held_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index bookings_conversation_idx on public.bookings (conversation_id);
create index bookings_room_idx on public.bookings (room_id) where status in ('held', 'confirmed');

create trigger bookings_set_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Messages
-- ---------------------------------------------------------------------------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid references public.profiles (id) on delete set null,
  kind public.message_kind not null default 'text',
  body text not null default '' check (char_length(body) <= 2000),
  booking_id uuid references public.bookings (id) on delete cascade,
  -- Set when an assistant (for example the AI auto-reply) wrote the message for the owner.
  via text,
  created_at timestamptz not null default now(),
  check (kind <> 'text' or char_length(btrim(body)) > 0),
  check (kind <> 'booking' or booking_id is not null)
);
create index messages_conversation_idx on public.messages (conversation_id, created_at);

create or replace function public.touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations
  set last_message_at = new.created_at,
      tenant_last_read_at = case when new.sender_id = tenant_id then new.created_at else tenant_last_read_at end,
      owner_last_read_at = case when new.sender_id = owner_id then new.created_at else owner_last_read_at end
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_touch_conversation
after insert on public.messages
for each row execute function public.touch_conversation();

-- ---------------------------------------------------------------------------
-- In-app notifications
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

create or replace function public.notify(target uuid, kind text, title text, body text, link text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (user_id, kind, title, body, link) values (target, kind, title, body, link);
$$;
revoke execute on function public.notify from public, anon, authenticated;

-- A new message notifies the other side of the conversation.
create or replace function public.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  c record;
  dorm_name text;
  sender_name text;
begin
  if new.kind = 'system' then return new; end if;
  select * into c from public.conversations where id = new.conversation_id;
  select name into dorm_name from public.dorms where id = c.dorm_id;
  select coalesce(display_name, 'ผู้ใช้') into sender_name from public.profiles where id = new.sender_id;
  perform public.notify(
    case when new.sender_id = c.tenant_id then c.owner_id else c.tenant_id end,
    case when new.kind = 'booking' then 'booking_request' else 'message' end,
    case when new.kind = 'booking' then sender_name || ' ขอจองห้องที่ ' || dorm_name else sender_name || ' ส่งข้อความถึงคุณ' end,
    left(new.body, 140),
    '/chat/' || c.id
  );
  return new;
end;
$$;

create trigger messages_notify
after insert on public.messages
for each row execute function public.notify_new_message();

-- ---------------------------------------------------------------------------
-- Booking actions
-- ---------------------------------------------------------------------------
create or replace function public.booking_label(target public.bookings)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select rt.name || coalesce(' ห้อง ' || r.room_no, '')
  from public.room_types rt
  left join public.rooms r on r.id = target.room_id
  where rt.id = target.room_type_id;
$$;

/** Tenant: send a booking request card in a conversation. */
create or replace function public.request_booking(
  target_conversation_id uuid,
  target_room_type_id uuid,
  target_move_in date,
  target_months smallint,
  target_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  c record;
  b public.bookings;
begin
  select * into c from public.conversations where id = target_conversation_id;
  if c is null or c.tenant_id <> (select auth.uid()) then
    raise exception 'not_allowed' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.room_types where id = target_room_type_id and dorm_id = c.dorm_id) then
    raise exception 'room_type_not_found' using errcode = 'P0001';
  end if;
  if target_move_in < current_date then
    raise exception 'move_in_in_past' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.bookings where conversation_id = c.id and status in ('pending', 'held')) then
    raise exception 'booking_already_open' using errcode = 'P0001';
  end if;

  insert into public.bookings (conversation_id, dorm_id, room_type_id, tenant_id, owner_id, move_in_date, months, note)
  values (c.id, c.dorm_id, target_room_type_id, c.tenant_id, c.owner_id, target_move_in, target_months, nullif(btrim(target_note), ''))
  returning * into b;

  insert into public.messages (conversation_id, sender_id, kind, body, booking_id)
  values (c.id, c.tenant_id, 'booking', 'ขอจอง ' || public.booking_label(b) || ' เข้าอยู่ ' || to_char(b.move_in_date, 'DD/MM/YYYY') || ' ' || b.months || ' เดือน', b.id);
  return b.id;
end;
$$;

/**
 * Owner: respond to a booking. 'hold' reserves a vacant room for some hours, 'confirm'
 * books it (room becomes occupied), 'decline' closes the request and frees any held room.
 */
create or replace function public.respond_booking(
  target_booking_id uuid,
  action text,
  target_room_id uuid default null,
  hold_hours integer default 24
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  b public.bookings;
  room record;
  message text;
begin
  select * into b from public.bookings where id = target_booking_id for update;
  if b is null or b.owner_id <> (select auth.uid()) then
    raise exception 'not_allowed' using errcode = 'P0001';
  end if;
  if b.status not in ('pending', 'held') then
    raise exception 'booking_closed' using errcode = 'P0001';
  end if;

  if action in ('hold', 'confirm') then
    -- Keep the room already held for this booking unless another one is chosen.
    target_room_id := coalesce(target_room_id, b.room_id);
    select * into room from public.rooms r where r.id = target_room_id and r.room_type_id = b.room_type_id for update;
    if room is null then
      raise exception 'room_required' using errcode = 'P0001';
    end if;
    if room.status <> 'vacant' and room.id is distinct from b.room_id then
      raise exception 'room_not_vacant' using errcode = 'P0001';
    end if;
    -- Moving to a different room releases the one held before.
    if b.room_id is not null and b.room_id <> room.id then
      update public.rooms set status = 'vacant', held_until = null where id = b.room_id and status = 'held';
    end if;
  end if;

  if action = 'hold' then
    hold_hours := least(greatest(hold_hours, 1), 168);
    update public.rooms set status = 'held', held_until = now() + make_interval(hours => hold_hours) where id = room.id;
    update public.bookings set status = 'held', room_id = room.id, held_until = now() + make_interval(hours => hold_hours) where id = b.id;
    message := 'เจ้าของหอกันห้อง ' || room.room_no || ' ไว้ให้ถึง ' || to_char((now() + make_interval(hours => hold_hours)) at time zone 'Asia/Bangkok', 'DD/MM HH24:MI') || ' น.';
  elsif action = 'confirm' then
    update public.rooms set status = 'occupied', held_until = null where id = room.id;
    update public.bookings set status = 'confirmed', room_id = room.id, held_until = null where id = b.id;
    message := 'เจ้าของหอยืนยันการจองห้อง ' || room.room_no || ' แล้ว';
  elsif action = 'decline' then
    if b.room_id is not null then
      update public.rooms set status = 'vacant', held_until = null where id = b.room_id and status = 'held';
    end if;
    update public.bookings set status = 'declined', held_until = null where id = b.id;
    message := 'เจ้าของหอปฏิเสธคำขอจองนี้';
  else
    raise exception 'unknown_action' using errcode = 'P0001';
  end if;

  insert into public.messages (conversation_id, sender_id, kind, body, booking_id)
  values (b.conversation_id, b.owner_id, 'system', message, b.id);
  perform public.notify(b.tenant_id, 'booking_' || action, message, null, '/chat/' || b.conversation_id);
end;
$$;

/** Tenant: withdraw an open request; a held room goes back to vacant. */
create or replace function public.cancel_booking(target_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  b public.bookings;
begin
  select * into b from public.bookings where id = target_booking_id for update;
  if b is null or b.tenant_id <> (select auth.uid()) then
    raise exception 'not_allowed' using errcode = 'P0001';
  end if;
  if b.status not in ('pending', 'held') then
    raise exception 'booking_closed' using errcode = 'P0001';
  end if;
  if b.room_id is not null then
    update public.rooms set status = 'vacant', held_until = null where id = b.room_id and status = 'held';
  end if;
  update public.bookings set status = 'cancelled', held_until = null where id = b.id;
  insert into public.messages (conversation_id, sender_id, kind, body, booking_id)
  values (b.conversation_id, b.tenant_id, 'system', 'ผู้เช่ายกเลิกคำขอจอง', b.id);
  perform public.notify(b.owner_id, 'booking_cancelled', 'ผู้เช่ายกเลิกคำขอจอง', null, '/chat/' || b.conversation_id);
end;
$$;

/** Releases holds whose time is up. Run every few minutes by pg_cron, and safe to call any time. */
create or replace function public.expire_booking_holds()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  b record;
  n integer := 0;
begin
  for b in
    select * from public.bookings where status = 'held' and held_until < now() for update skip locked
  loop
    update public.rooms set status = 'vacant', held_until = null where id = b.room_id and status = 'held';
    update public.bookings set status = 'expired', held_until = null where id = b.id;
    insert into public.messages (conversation_id, sender_id, kind, body, booking_id)
    values (b.conversation_id, null, 'system', 'หมดเวลากันห้อง ห้องกลับมาว่างแล้ว', b.id);
    perform public.notify(b.tenant_id, 'booking_expired', 'หมดเวลากันห้องแล้ว', null, '/chat/' || b.conversation_id);
    n := n + 1;
  end loop;
  return n;
end;
$$;

grant execute on function public.request_booking, public.respond_booking, public.cancel_booking, public.expire_booking_holds to authenticated;

create extension if not exists pg_cron;
select cron.schedule('expire-booking-holds', '*/5 * * * *', 'select public.expire_booking_holds()');

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.bookings enable row level security;
alter table public.notifications enable row level security;

create policy "participants read conversations"
  on public.conversations for select to authenticated
  using ((select auth.uid()) in (tenant_id, owner_id));

create policy "tenants start conversations"
  on public.conversations for insert to authenticated
  with check (tenant_id = (select auth.uid()));

create policy "participants mark conversations read"
  on public.conversations for update to authenticated
  using ((select auth.uid()) in (tenant_id, owner_id))
  with check ((select auth.uid()) in (tenant_id, owner_id));

create policy "participants read messages"
  on public.messages for select to authenticated
  using (public.is_participant(conversation_id));

-- Clients only send plain text; booking cards and system notes come from the functions above.
create policy "participants send text"
  on public.messages for insert to authenticated
  with check (sender_id = (select auth.uid()) and kind = 'text' and via is null and public.is_participant(conversation_id));

create policy "participants read bookings"
  on public.bookings for select to authenticated
  using ((select auth.uid()) in (tenant_id, owner_id));

create policy "users read their notifications"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));

create policy "users mark their notifications read"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Read markers are the only conversation columns a participant may change.
create or replace function public.protect_conversation_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- current_user, not auth.role(): security-definer triggers (touch_conversation) run as the
  -- function owner and may move last_message_at, while a signed-in client may not.
  if current_user = 'authenticated' and (
    new.dorm_id <> old.dorm_id or new.tenant_id <> old.tenant_id or new.owner_id <> old.owner_id
    or new.last_message_at <> old.last_message_at
  ) then
    raise exception 'not_allowed' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger conversations_protect_fields
before update on public.conversations
for each row execute function public.protect_conversation_fields();

alter publication supabase_realtime add table public.messages, public.bookings, public.notifications;
