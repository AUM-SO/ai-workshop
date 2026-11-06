# Dorm Platform – Product Plan

แพลตฟอร์มหอพัก: เจ้าของหอสร้างโปรเจกต์ (หอพัก) และลงข้อมูลห้องพัก, ผู้ใช้ทั่วไปเข้ามาค้นหา ดูรายละเอียด และจองห้องผ่านแชท

## 1. Requirements

### ผู้ใช้ (Roles)

| Role | ทำอะไรได้ |
|------|-----------|
| Guest (ไม่ล็อกอิน) | ค้นหา/ดูหอพักและห้องพัก |
| Tenant (ผู้เช่า) | ทุกอย่างของ Guest + แชทกับเจ้าของหอ, ส่งคำขอจอง, รีวิว |
| Owner (เจ้าของหอ) | สร้าง/แก้ไขโปรเจกต์หอพัก, จัดการห้อง, ตอบแชท, ยืนยัน/ปฏิเสธการจอง |
| Admin | ตรวจสอบ (verify) เจ้าของหอ, จัดการประกาศที่ผิดกฎ |

### Functional requirements (MVP)

**Owner**
- สมัคร/ล็อกอิน แล้วสร้างโปรเจกต์หอพัก: ชื่อ, ที่อยู่ + หมุดแผนที่, รูป, สิ่งอำนวยความสะดวก, กฎหอ, ประเภท (ชาย/หญิง/รวม)
- เพิ่ม "ประเภทห้อง" (room type): ขนาด, ราคา/เดือน, ค่ามัดจำ, ค่าล่วงหน้า, อัตราค่าน้ำ/ค่าไฟ, เฟอร์นิเจอร์, รูป
- เพิ่มห้องจริง (room) ใต้ประเภทห้อง: เลขห้อง, ชั้น, สถานะ (ว่าง / ติดจอง / มีผู้เช่า / ปิดปรับปรุง)
- กล่องแชทรวมทุกผู้สนใจ, ยืนยันหรือปฏิเสธคำขอจองจากในแชท

**Tenant / Guest**
- ค้นหาด้วย: ทำเล/แผนที่, ใกล้มหาวิทยาลัยหรือ BTS/MRT, ช่วงราคา, ประเภทหอ, สิ่งอำนวยความสะดวก
- หน้ารายละเอียดหอ: รูป, ห้องที่ว่างจริงตอนนี้, ค่าใช้จ่ายทั้งหมด, แผนที่, รีวิว
- กด "แชทเพื่อจอง" จากห้องที่ต้องการ → เปิดแชทกับเจ้าของหอพร้อมการ์ดข้อมูลห้อง
- ส่งคำขอจอง (วันเข้าอยู่, ระยะสัญญา) ในแชท แล้วติดตามสถานะการจอง

### Non-functional
- Mobile-first (ผู้ใช้ส่วนใหญ่เข้าจากมือถือ), ภาษาไทยเป็นหลัก รองรับอังกฤษ
- แชทแบบ real-time
- ข้อมูลส่วนตัว (เบอร์, บัตรประชาชน) ปกป้องตาม PDPA

## 2. Market research – เว็บใกล้เคียง

| เว็บ / แอป | กลุ่ม | จุดเด่น | ช่องว่างที่เห็น |
|-----------|------|---------|----------------|
| [RentHub](https://www.renthub.in.th) | หอพัก/อพาร์ตเมนต์ทั่วไทย | ประกาศเยอะ, ค้นหาตาม BTS/MRT/สถานศึกษา, badge Verified, แชทกับเจ้าของแบบ real-time, แพ็กเกจโปรโมตแบบเสียเงิน | ประกาศคือ listing แยกจากระบบจัดการหอ → สถานะห้องว่างมักไม่อัปเดต, การจองยังจบนอกระบบ |
| [Hipflat](https://www.hipflat.co.th) / DDproperty | คอนโด/บ้าน | ข้อมูลราคาเฉลี่ยตามทำเล, ประกาศจำนวนมาก | ไม่เน้นหอพักรายเดือนราคาประหยัด, ไม่มี flow จอง |
| [RentRoomTH](https://rentroomth.com) | หอพักใกล้สถานศึกษา | แยกหน้าค้นหาตามมหาวิทยาลัย | ฟีเจอร์ค้นหาพื้นฐาน, ไม่มีจองออนไลน์ |
| [dorm.utcc.ac.th](https://dorm.utcc.ac.th/) (เว็บหอของมหาวิทยาลัย) | นักศึกษา ม.เดียว | กรองราคา, ระยะห่างจาก ม., ประเภทหอ | จำกัดแค่ 1 มหาวิทยาลัย |
| [Horganice](https://www.horganice.in.th) | ระบบจัดการหอ (ฝั่งเจ้าของ) | จดมิเตอร์ผ่านแอป, ส่งบิลออนไลน์, ผู้เช่าดูบิล/แจ้งซ่อม/รับข่าวสาร | เป็นระบบหลังบ้าน ไม่ได้เป็น marketplace หาผู้เช่า |
| กลุ่ม Facebook / Airbnb | ทั่วไป | คนใช้เยอะ, ฟรี | ข้อมูลกระจัดกระจาย, เสี่ยงมิจฉาชีพเก็บมัดจำก่อนดูห้อง, Airbnb ไม่เหมาะเช่ารายเดือนระยะยาว |

**ข้อสรุป:** ตลาดแบ่งเป็น 2 ฝั่ง — เว็บประกาศ (หาคนเช่า) กับโปรแกรมจัดการหอ (หลังบ้าน) และยังไม่ค่อยเชื่อมกัน ปัญหาที่ผู้เช่าเจอบ่อยคือ ห้องที่ประกาศไม่ว่างจริง, ค่าใช้จ่ายแฝง (ค่าน้ำ/ไฟ/มัดจำ), และความเสี่ยงโดนโกงมัดจำ ส่วนเจ้าของหอต้องตอบคำถามซ้ำ ๆ ทางแชทและจัดการการจองด้วยมือ

## 3. Standout features (สิ่งที่ทำให้ต่างจากเว็บอื่น)

1. **ห้องว่างจริงแบบ real-time (Live Room Map)** – ผังห้องรายชั้นแบบกริด สีบอกสถานะ ห้องที่จองผ่านแชทจะเปลี่ยนสถานะอัตโนมัติ ประกาศจึงไม่ค้าง เพราะ listing กับการจัดการห้องเป็นข้อมูลชุดเดียวกัน
2. **จองในแชทแบบมีโครงสร้าง (Chat-to-Book)** – แชทไม่ใช่แค่ข้อความ: ผู้เช่าส่ง "การ์ดคำขอจอง" (ห้อง, วันเข้าอยู่, ระยะสัญญา) เจ้าของกด ยืนยัน / ปฏิเสธ / เสนอห้องอื่น ได้ในแชท และ hold ห้องไว้ชั่วคราวพร้อมเวลานับถอยหลัง
3. **ค่าใช้จ่ายโปร่งใส (Move-in Cost Calculator)** – คำนวณเงินที่ต้องจ่ายวันเข้าอยู่ (ค่าเช่าล่วงหน้า + มัดจำ + ค่าธรรมเนียม) และประมาณค่าใช้จ่ายรายเดือนรวมค่าน้ำ/ไฟตามการใช้งาน ให้เทียบระหว่างหอได้แบบแอปเปิลต่อแอปเปิล
4. **ค้นหาตามเวลาเดินทาง (Commute Search)** – ใส่ที่เรียน/ที่ทำงาน แล้วกรองหอที่เดินทางไม่เกิน X นาที (เดิน / มอเตอร์ไซค์ / รถไฟฟ้า) แทนการค้นแค่ระยะทาง
5. **ผู้ช่วย AI ตอบแชทแทนเจ้าของ (AI Auto-reply)** – ตอบคำถามทั่วไป (ราคา, ห้องว่าง, กฎหอ, เลี้ยงสัตว์ได้ไหม) จากข้อมูลหอทันที แม้เจ้าของออฟไลน์ แล้วส่งต่อให้เจ้าของเมื่อถึงขั้นจอง
6. **แจ้งเตือนผ่าน LINE** – เจ้าของหอส่วนใหญ่ใช้ LINE อยู่แล้ว: แจ้งข้อความใหม่/คำขอจองผ่าน LINE ทำให้ตอบเร็วขึ้น
7. **ความน่าเชื่อถือ (Trust layer)** – ยืนยันตัวตนเจ้าของหอ + เอกสารสิทธิ์, รีวิวได้เฉพาะคนที่เคยจองผ่านระบบ, คำเตือนกันโกง "อย่าโอนมัดจำก่อนดูห้อง/ยืนยันในระบบ"
8. **รอห้องว่าง (Waitlist)** – กด "แจ้งเตือนเมื่อห้องประเภทนี้ว่าง" ระบบแจ้งทันทีเมื่อสถานะห้องเปลี่ยน
9. **หาเพื่อนร่วมห้อง (Roommate Match)** – สำหรับห้องคู่ จับคู่ตามไลฟ์สไตล์ (เวลานอน, สูบบุหรี่, สัตว์เลี้ยง)
10. **Owner Insights** – แดชบอร์ดอัตราเข้าพัก, จำนวนคนดู, อัตราแชท→จอง, ราคาเทียบหอใกล้เคียง

## 4. Scope แบ่งเฟส

| เฟส | ฟีเจอร์ |
|-----|---------|
| **MVP** | Auth (owner/tenant), สร้างหอ + ประเภทห้อง + ห้อง, ค้นหา + แผนที่ + ตัวกรอง, หน้ารายละเอียดหอ, แชท real-time, Chat-to-Book (#2), Live Room Map (#1), Move-in Cost Calculator (#3) |
| **Phase 2** | LINE notification (#6), Waitlist (#8), รีวิวจากผู้เช่าจริง + verify เจ้าของ (#7), Commute Search (#4) |
| **Phase 3** | AI Auto-reply (#5), Owner Insights (#10), Roommate Match (#9), ชำระมัดจำออนไลน์ (PromptPay) |

## 5. Data model (ร่าง)

```
profiles      id, role (owner|tenant|admin), display_name, phone, avatar_url, verified_at
dorms         id, owner_id → profiles, name, description, address, lat, lng,
              gender_policy (male|female|mixed), amenities[], rules, cover_url, status (draft|published)
dorm_photos   id, dorm_id, url, sort_order
room_types    id, dorm_id, name, size_sqm, monthly_price, deposit, advance_months,
              water_rate, electric_rate, other_fees, furniture[]
rooms         id, room_type_id, room_no, floor, status (vacant|held|occupied|maintenance), held_until
conversations id, dorm_id, tenant_id, owner_id, created_at
messages      id, conversation_id, sender_id, kind (text|booking_request|booking_update|system),
              body, payload jsonb, created_at
bookings      id, conversation_id, room_id, tenant_id, move_in_date, contract_months,
              status (requested|held|confirmed|rejected|cancelled), created_at
reviews       id, dorm_id, tenant_id, booking_id, rating, comment
```

ข้อความชนิด `booking_request` / `booking_update` คือการ์ดในแชท โดย `payload` อ้างอิงไปที่ `bookings`

## 6. Tech stack ที่แนะนำ

- **Next.js (App Router) + TypeScript + Tailwind CSS** – SEO ดีสำหรับหน้าหอพัก (คนค้นจาก Google), ทำเว็บ mobile-first ง่าย
- **Supabase** – Postgres + Auth + Storage (รูปห้อง) + Realtime (แชท, สถานะห้อง) + Row Level Security ในที่เดียว
- **แผนที่:** Leaflet + OpenStreetMap (ฟรี) หรือ Google Maps (ถ้าต้องการ Commute Search ที่แม่นกว่า)
- **Deploy:** Vercel

## Sources

- RentHub app listing: https://apps.apple.com/th/app/renthub/id1609161570
- RentHub packages: https://www.renthub.in.th/en/packages/promote
- ExpatDen – recommended apartment rental sites: https://www.expatden.com/th/thailand/recommended-apartment-rental-sites/
- RentRoomTH – หอพักใกล้สถานศึกษา: https://rentroomth.com
- UTCC dorm search: https://dorm.utcc.ac.th/
- Horganice Owner app: https://apps.apple.com/app/id1099572463
- Horganice ID docs: https://docs.horganice.in.th/?p=788
