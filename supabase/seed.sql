-- Local development accounts. Loaded by `npx supabase db reset` (never in production).
--
--   owner@dormdee.test   / dormdee-local-1234   (เจ้าของหอ)
--   tenant@dormdee.test  / dormdee-local-1234   (ผู้เช่า)
--   admin@dormdee.test   / dormdee-local-1234   (ผู้ดูแลระบบ)
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
      ('22222222-2222-4222-8222-222222222222'::uuid, 'tenant@dormdee.test', 'ผู้เช่าทดสอบ', 'tenant'),
      ('33333333-3333-4333-8333-333333333333'::uuid, 'admin@dormdee.test', 'ผู้ดูแลระบบ', 'tenant')
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
  -- Sign-up never grants admin; promote the local admin account here.
  update public.profiles set role = 'admin' where id = '33333333-3333-4333-8333-333333333333';
end $$;

-- ---------------------------------------------------------------------------
-- Sample published dorms for search, map and detail pages (owner@dormdee.test).
-- Photos point at /public/seed. Dorms that already exist by name are skipped.
-- ---------------------------------------------------------------------------
do $$
declare
  owner_id uuid := '11111111-1111-4111-8111-111111111111';
  d record;
  t record;
  dorm_id uuid;
  type_id uuid;
  fl integer;
  n integer;
  statuses public.room_status[] := array['occupied', 'vacant', 'occupied', 'held', 'occupied', 'vacant', 'occupied', 'maintenance']::public.room_status[];
begin
  for d in
    select * from (values
      ('ลิโด้ เรสซิเดนซ์ สามย่าน', 'female'::public.gender_policy, '88 ซอยจุฬาลงกรณ์ 12 แขวงวังใหม่', 'ปทุมวัน', 'กรุงเทพมหานคร', 13.7330, 100.5290,
        array['จุฬาลงกรณ์มหาวิทยาลัย', 'MRT สามย่าน', 'สามย่านมิตรทาวน์'], array['air_conditioner', 'wifi', 'keycard', 'cctv', 'elevator'],
        'หอหญิงเดินไปจุฬาฯ 5 นาที ใกล้ MRT สามย่าน ร้านอาหารเยอะ เงียบ ปลอดภัย มีรปภ. ตลอด 24 ชั่วโมง', 3, 6500),
      ('เดอะ แคมปัส เกษตร', 'mixed', '12/4 ถนนพหลโยธิน แขวงลาดยาว', 'จตุจักร', 'กรุงเทพมหานคร', 13.8470, 100.5700,
        array['มหาวิทยาลัยเกษตรศาสตร์', 'BTS เสนานิคม'], array['air_conditioner', 'wifi', 'motorcycle_parking', 'laundry', 'drinking_water'],
        'ตรงข้ามประตูงามวงศ์วาน ม.เกษตร ห้องใหม่ มีที่จอดมอเตอร์ไซค์ เครื่องซักผ้าหยอดเหรียญ', 4, 4200),
      ('รังสิต สมาร์ท ดอร์ม', 'mixed', '99 หมู่ 18 ถนนพหลโยธิน ตำบลคลองหนึ่ง', 'คลองหลวง', 'ปทุมธานี', 14.0730, 100.6080,
        array['มหาวิทยาลัยธรรมศาสตร์ รังสิต', 'เชียงราก'], array['wifi', 'motorcycle_parking', 'laundry', 'convenience_store'],
        'หอราคานักศึกษา ใกล้ธรรมศาสตร์ รังสิต มีห้องพัดลมและห้องแอร์ มีร้านสะดวกซื้อชั้นล่าง', 3, 2600),
      ('อ่อนนุช ซิตี้ ลอฟท์', 'mixed', '45 ซอยสุขุมวิท 77 แขวงอ่อนนุช', 'วัฒนา', 'กรุงเทพมหานคร', 13.7050, 100.6010,
        array['BTS อ่อนนุช', 'ตลาดอ่อนนุช'], array['air_conditioner', 'wifi', 'elevator', 'fitness', 'keycard', 'car_parking'],
        'อพาร์ตเมนต์สไตล์ลอฟท์ เดิน 3 นาทีถึง BTS อ่อนนุช มีฟิตเนสและที่จอดรถยนต์', 5, 5500),
      ('นิมมาน การ์เด้น', 'mixed', '7 ซอยนิมมานเหมินท์ 9 ตำบลสุเทพ', 'เมืองเชียงใหม่', 'เชียงใหม่', 18.7960, 98.9680,
        array['มหาวิทยาลัยเชียงใหม่', 'นิมมานเหมินท์', 'เมญ่า'], array['air_conditioner', 'wifi', 'water_heater', 'pets_allowed'],
        'หอบรรยากาศสวน ใกล้ มช. และถนนนิมมาน เลี้ยงสัตว์เล็กได้', 3, 4000),
      ('ห้วยขวาง เพลส', 'male', '201 ถนนประชาราษฎร์บำเพ็ญ แขวงห้วยขวาง', 'ห้วยขวาง', 'กรุงเทพมหานคร', 13.7780, 100.5740,
        array['MRT ห้วยขวาง', 'ตลาดห้วยขวาง'], array['air_conditioner', 'wifi', 'cctv', 'motorcycle_parking'],
        'หอชาย ใกล้ MRT ห้วยขวาง เดินทางสะดวก ค่าใช้จ่ายไม่แพง', 4, 3800),
      ('อนุสาวรีย์ แมนชั่น', 'female', '15 ถนนราชวิถี แขวงทุ่งพญาไท', 'ราชเทวี', 'กรุงเทพมหานคร', 13.7650, 100.5380,
        array['BTS อนุสาวรีย์ชัยฯ', 'โรงพยาบาลราชวิถี'], array['air_conditioner', 'wifi', 'elevator', 'keycard', 'security_guard'],
        'หอหญิงใจกลางเมือง ใกล้ BTS อนุสาวรีย์ชัยฯ ปลอดภัยด้วยคีย์การ์ดและ รปภ.', 4, 4800)
    ) as v(name, gender, address, district, province, lat, lng, nearby, amenities, description, floors, price)
  loop
    continue when exists (select 1 from public.dorms where name = d.name);

    insert into public.dorms (owner_id, name, gender_policy, address, district, province, lat, lng, nearby, amenities, description, rules)
    values (owner_id, d.name, d.gender, d.address, d.district, d.province, d.lat, d.lng, d.nearby, d.amenities, d.description,
            'ห้ามสูบบุหรี่ในห้องพัก ปิดประตูหอเวลา 24:00 น.')
    returning id into dorm_id;

    insert into public.dorm_photos (dorm_id, url, sort_order) values
      (dorm_id, '/seed/building-' || (1 + (length(d.name) % 2)) || '.jpg', 0),
      (dorm_id, '/seed/room-1.jpg', 1),
      (dorm_id, '/seed/room-2.jpg', 2);
    update public.dorms set cover_url = '/seed/building-' || (1 + (length(d.name) % 2)) || '.jpg' where id = dorm_id;

    for t in
      select * from (values
        ('ห้องมาตรฐาน', 22, d.price, 1),
        ('ห้องใหญ่', 30, d.price + 1500, 2)
      ) as v(type_name, size, price, kind)
    loop
      insert into public.room_types (dorm_id, name, size_sqm, monthly_price, deposit, advance_months, water_rate, electric_rate, furniture, other_fees)
      values (dorm_id, t.type_name, t.size, t.price, t.price * 2, 1, 18, 7,
              array['bed', 'mattress', 'wardrobe', 'desk'] || case when t.kind = 2 then array['fridge', 'tv'] else '{}' end,
              '[{"label": "ค่าส่วนกลาง", "amount": 200, "monthly": true}]')
      returning id into type_id;

      -- Standard rooms on the lower floors, large rooms on the top floor.
      for fl in (case when t.kind = 1 then 2 else d.floors end)..(case when t.kind = 1 then d.floors - 1 else d.floors end) loop
        for n in 1..8 loop
          insert into public.rooms (room_type_id, dorm_id, room_no, floor, status)
          values (type_id, dorm_id, fl::text || lpad(n::text, 2, '0'), fl, statuses[1 + ((n + fl + length(d.name)) % 8)]);
        end loop;
      end loop;
    end loop;

    update public.dorms set status = 'published' where id = dorm_id;
  end loop;
end $$;
