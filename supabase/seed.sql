-- Local development accounts. Loaded by `npx supabase db reset` (never in production).
--
--   owner@dormdee.test   / dormdee-local-1234   (เจ้าของหอ)
--   tenant@dormdee.test  / dormdee-local-1234   (ผู้เช่า)
--
-- Re-running is safe: existing accounts are left alone.

create extension if not exists pgcrypto with schema extensions;

do $$
declare
  account record;
begin
  for account in
    select * from (values
      ('11111111-1111-4111-8111-111111111111'::uuid, 'owner@dormdee.test', 'เจ้าของหอทดสอบ', 'owner'),
      ('22222222-2222-4222-8222-222222222222'::uuid, 'tenant@dormdee.test', 'ผู้เช่าทดสอบ', 'tenant')
    ) as t(id, email, display_name, role)
  loop
    if not exists (select 1 from auth.users where email = account.email) then
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, email_change, email_change_token_new, recovery_token
      ) values (
        '00000000-0000-0000-0000-000000000000', account.id, 'authenticated', 'authenticated', account.email,
        extensions.crypt('dormdee-local-1234', extensions.gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('display_name', account.display_name, 'role', account.role),
        now(), now(), '', '', '', ''
      );
      insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      values (
        gen_random_uuid(), account.id, account.id::text,
        jsonb_build_object('sub', account.id::text, 'email', account.email, 'email_verified', true),
        'email', now(), now(), now()
      );
    end if;
  end loop;
end $$;
