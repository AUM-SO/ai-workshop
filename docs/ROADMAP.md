# Roadmap – แบ่งงานเป็น Phase

แต่ละ phase จบด้วยสิ่งที่ใช้งาน/เดโมได้จริง ทำตาม [DEVELOP_FLOW.md](DEVELOP_FLOW.md): 1 feature = 1 branch `feature/*` → PR เข้า `develop` → จบ phase ทำ `release/*` → `main`

| Phase | ชื่อ | ระยะเวลา (ประมาณ) | Release |
|-------|------|-------------------|---------|
| 0 | Foundation | 1 สัปดาห์ | – |
| 1 | Owner: สร้างหอ + ห้อง | 2 สัปดาห์ | – |
| 2 | Tenant: ค้นหา + ดูหอ | 2 สัปดาห์ | – |
| 3 | Chat-to-Book | 2 สัปดาห์ | **v1.0.0 (MVP)** |
| 4 | Trust + Engagement | 2–3 สัปดาห์ | v1.1.0 |
| 5 | Smart features | 3–4 สัปดาห์ | v1.2.0 |

---

## Phase 0 – Foundation

เป้าหมาย: โครงโปรเจกต์พร้อม, ล็อกอินได้, DB พร้อม

| Feature branch | งาน |
|----------------|-----|
| `feature/project-setup` | Next.js + TypeScript + Tailwind, ESLint/Prettier, โครงโฟลเดอร์, layout หลัก (header/footer, mobile-first) |
| `feature/supabase-schema` | สร้าง Supabase project, migration ตาราง `profiles, dorms, dorm_photos, room_types, rooms`, RLS policy |
| `feature/auth` | สมัคร/ล็อกอิน (อีเมล + Google), เลือก role owner/tenant, หน้าโปรไฟล์ |
| `feature/ci` | GitHub Actions: lint + typecheck + build, preview deploy บน Vercel |

**Done เมื่อ:** สมัครเป็น owner หรือ tenant ได้ และเว็บ deploy บน preview URL

## Phase 1 – Owner: สร้างหอ + ห้อง

เป้าหมาย: เจ้าของหอลงข้อมูลครบและ publish ได้

| Feature branch | งาน |
|----------------|-----|
| `feature/dorm-create` | ฟอร์มสร้างหอแบบ step (ข้อมูลทั่วไป → ที่อยู่ + ปักหมุดแผนที่ → สิ่งอำนวยความสะดวก/กฎ), draft/publish |
| `feature/dorm-photos` | อัปโหลดรูปไป Supabase Storage, เรียงลำดับ, เลือกรูปปก, บีบอัดรูป |
| `feature/room-types` | CRUD ประเภทห้อง: ขนาด, ราคา, มัดจำ, ล่วงหน้า, ค่าน้ำ/ไฟ, เฟอร์นิเจอร์ |
| `feature/rooms-bulk` | เพิ่มห้องทีละหลายห้อง (เช่น ชั้น 2 ห้อง 201–210) |
| `feature/live-room-map-owner` | ผังห้องรายชั้น (กริด) กดเปลี่ยนสถานะ ว่าง/ติดจอง/มีผู้เช่า/ปิดปรับปรุง |
| `feature/owner-dashboard` | หน้ารวมหอของฉัน + จำนวนห้องว่าง/ไม่ว่าง |

**Done เมื่อ:** owner สร้างหอ ใส่รูป ห้อง และ publish ได้ครบ

**สถานะ (6 พ.ย. 2026):** เสร็จแล้ว ทำใน branch `feature/dorm-create`, `feature/dorm-photos`, `feature/room-types`, `feature/rooms` (รวม rooms-bulk กับ live-room-map-owner) และ `feature/owner-dashboard` ส่วนการอัปเดตผังห้องแบบ realtime ให้ผู้เช่าเห็น ย้ายไปทำพร้อม `feature/live-room-map-public` ใน Phase 2

## Phase 2 – Tenant: ค้นหา + ดูหอ

เป้าหมาย: คนทั่วไปค้นหาเจอและเห็นข้อมูลที่ตัดสินใจได้

| Feature branch | งาน |
|----------------|-----|
| `feature/search` | ค้นหาตามทำเล/ชื่อ ม./สถานี, ตัวกรอง ราคา, ประเภทหอ (ชาย/หญิง/รวม), สิ่งอำนวยความสะดวก, มีห้องว่าง |
| `feature/search-map` | มุมมองแผนที่ (Leaflet + OSM) คู่กับรายการ |
| `feature/dorm-detail` | หน้ารายละเอียด: แกลเลอรี, ประเภทห้อง + จำนวนว่าง, กฎ, แผนที่ |
| `feature/live-room-map-public` | ผังห้องแบบ read-only ให้ผู้เช่าเห็นห้องว่างจริง (Supabase Realtime) |
| `feature/move-in-cost` | Move-in Cost Calculator: เงินวันเข้าอยู่ + ประมาณค่าใช้จ่ายรายเดือน (ปรับหน่วยน้ำ/ไฟได้) |
| `feature/seo` | SSR/metadata, sitemap, Open Graph ให้แชร์ลิงก์หอสวย |

**Done เมื่อ:** Guest เปิดเว็บ ค้นหา เห็นห้องว่างจริง และเห็นค่าใช้จ่ายทั้งหมด

**สถานะ (6 พ.ย. 2026):** เสร็จแล้ว ทำใน branch `feature/search-data` (ฟังก์ชัน search_dorms, สถานที่ใกล้เคียง, ข้อมูลตัวอย่าง), `feature/dorm-detail`, `feature/move-in-cost`, `feature/live-room-map-public`, `feature/search` (รวม search-map) และ `feature/seo` ปุ่มแชทในหน้าหอเปิดใช้แล้วใน Phase 3

## Phase 3 – Chat-to-Book → release v1.0.0 (MVP)

เป้าหมาย: จองห้องผ่านแชทได้จบในระบบ

| Feature branch | งาน |
|----------------|-----|
| `feature/chat-schema` | ตาราง `conversations, messages, bookings` + RLS (เห็นเฉพาะคู่สนทนา) |
| `feature/chat-realtime` | แชท real-time, ส่งรูป, สถานะอ่านแล้ว, inbox ฝั่ง owner และ tenant |
| `feature/chat-to-book` | ปุ่ม "แชทเพื่อจอง" จากห้อง → การ์ดคำขอจอง (ห้อง, วันเข้าอยู่, ระยะสัญญา) |
| `feature/booking-actions` | owner กด ยืนยัน / ปฏิเสธ / เสนอห้องอื่น / hold ห้อง (นับถอยหลัง, หมดเวลาคืนสถานะอัตโนมัติ) |
| `feature/booking-status-sync` | การจองอัปเดตสถานะห้องใน Live Room Map อัตโนมัติ |
| `feature/in-app-notify` | แจ้งเตือนในเว็บ + อีเมล เมื่อมีข้อความ/คำขอจองใหม่ |

**Done เมื่อ:** tenant ขอจอง → owner ยืนยันในแชท → ห้องเปลี่ยนเป็น "ติดจอง" ทันที → ออก **v1.0.0**

**สถานะ (7 พ.ย. 2026):** เสร็จแล้ว ทำใน `feature/chat-schema` (ตาราง, RLS, ฟังก์ชัน `request_booking` / `respond_booking` / `cancel_booking`, cron คืนห้องที่กันไว้เมื่อหมดเวลาทุก 5 นาที, แจ้งเตือนในตาราง `notifications`) และ `feature/chat` (หน้า `/chat`, แชท real-time, การ์ดคำขอจอง, ปุ่มแชท/ขอจองในหน้าหอ, กระดิ่งแจ้งเตือนใน header, คำเตือนเมื่อมีการขอโอนเงินนอกระบบ) ยังไม่ได้ทำ: ส่งรูปในแชท และอีเมลแจ้งเตือน (ย้ายไปทำพร้อม LINE ใน Phase 4)

## Phase 4 – Trust + Engagement → v1.1.0

| Feature branch | งาน |
|----------------|-----|
| `feature/line-notify` | เชื่อม LINE Messaging API แจ้ง owner เมื่อมีแชท/คำขอจอง |
| `feature/waitlist` | "แจ้งเตือนเมื่อห้องว่าง" ต่อประเภทห้อง |
| `feature/owner-verify` | owner ส่งเอกสารยืนยันตัวตน/สิทธิ์ → admin อนุมัติ → badge Verified |
| `feature/reviews` | รีวิวได้เฉพาะคนที่มี booking confirmed |
| `feature/anti-scam` | คำเตือนในแชทเมื่อมีการพูดถึงโอนเงินนอกระบบ, ปุ่มรายงานประกาศ |
| `feature/admin-panel` | หน้า admin: อนุมัติ verify, จัดการรายงาน |

**สถานะ (8 พ.ย. 2026):** เสร็จแล้วใน `feature/trust` (migration `20261108000000_trust.sql`)
- แจ้งเตือนเมื่อห้องว่าง: ตาราง `room_type_watches` และ trigger แจ้งครั้งเดียวเมื่อห้องกลับมาว่าง
- รีวิว: ตาราง `reviews` รีวิวได้ 1 ครั้งต่อ booking ที่ยืนยันแล้ว แสดงคะแนนเฉลี่ยในหน้าหอ
- รายงานประกาศ: ตาราง `reports` ปุ่มรายงานในหน้าหอ (คำเตือนในแชททำไปแล้วใน Phase 3)
- ยืนยันตัวตนเจ้าของหอ: หน้า `/owner/verify` เก็บเอกสารใน bucket ส่วนตัว `verification-docs` ใช้ฟังก์ชัน `review_verification` และแสดงป้าย Verified ในหน้าหอ
- หน้า `/admin`: อนุมัติหรือปฏิเสธการยืนยันตัวตน, จัดการรายงาน, ปิดประกาศ บัญชี admin ในเครื่องคือ `admin@dormdee.test`
- LINE: เชื่อมบัญชีจากหน้าบัญชีด้วยรหัส 6 หลัก, webhook อยู่ที่ `/api/line/webhook`, ส่งการแจ้งเตือนในเว็บต่อไปที่ LINE หลังมีแชท การจอง หรือห้องว่าง ต้องตั้งค่า `SUPABASE_SECRET_KEY`, `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET` และ `LINE_BOT_BASIC_ID` (ดู `.env.example`) ถ้าไม่ตั้งค่า ส่วน LINE จะถูกซ่อนไว้

## Phase 5 – Smart features → v1.2.0

| Feature branch | งาน |
|----------------|-----|
| `feature/commute-search` | ค้นหาตามเวลาเดินทางไปที่เรียน/ที่ทำงาน |
| `feature/ai-auto-reply` | AI ตอบคำถามจากข้อมูลหอเมื่อ owner ออฟไลน์ แล้วส่งต่อเมื่อถึงขั้นจอง |
| `feature/owner-insights` | แดชบอร์ด: ยอดเข้าชม, แชท→จอง, อัตราเข้าพัก, ราคาเทียบหอใกล้เคียง |
| `feature/roommate-match` | จับคู่เพื่อนร่วมห้องตามไลฟ์สไตล์ |
| `feature/promptpay-deposit` | จ่ายมัดจำผ่าน PromptPay QR + แนบสลิป |

**สถานะ (9 พ.ย. 2026):** เสร็จแล้วใน `feature/smart` (migration `20261109000000_smart.sql`)
- ค้นหาตามเวลาเดินทาง: เลือกจุดหมาย (มหาวิทยาลัยและย่านหลัก ใน `lib/dorms/commute.ts`) วิธีเดินทาง และเวลาไม่เกินกี่นาที `search_dorms` กรองด้วยระยะทางเส้นตรง แล้วแอปประมาณเวลาเดินทางจากความเร็วเฉลี่ยของแต่ละวิธี (เป็นค่าประมาณ ไม่ใช่เส้นทางจริง)
- สถิติสำหรับเจ้าของหอ: แท็บ "สถิติ" แสดงผู้เข้าชม (`record_dorm_view`) อัตราแชทเป็นการจอง อัตราเข้าพัก และราคาเทียบกับหอในรัศมี 3 กม. (`nearby_price_stats`)
- มัดจำผ่าน PromptPay: เจ้าของหอตั้งหมายเลขในแท็บ "การรับจอง" เมื่อกันห้องหรือยืนยันแล้ว ผู้เช่าจะเห็น QR พร้อมยอดมัดจำและแนบสลิปได้ (bucket ส่วนตัว `deposit-slips`) เจ้าของหอกดยืนยันว่าได้รับเงิน ก่อนเปิดใช้จริงควรสแกน QR ทดสอบกับแอปธนาคาร
- หาเพื่อนร่วมห้อง: หน้า `/roommates` กรอกไลฟ์สไตล์แล้วจับคู่กับคนในจังหวัดเดียวกันตามคะแนนความเข้ากัน
- AI ตอบแชท: เปิดได้ในแท็บ "การรับจอง" ใช้ Claude (`claude-opus-5-5`) ตอบจากข้อมูลหอเมื่อเจ้าของหอไม่ได้อ่านหรือตอบมาเกิน 10 นาที และส่งต่อให้เจ้าของหอเมื่อเป็นเรื่องจองหรือต่อรอง ต้องตั้งค่า `ANTHROPIC_API_KEY` และ `SUPABASE_SECRET_KEY`
