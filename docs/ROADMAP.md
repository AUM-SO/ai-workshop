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

## Phase 4 – Trust + Engagement → v1.1.0

| Feature branch | งาน |
|----------------|-----|
| `feature/line-notify` | เชื่อม LINE Messaging API แจ้ง owner เมื่อมีแชท/คำขอจอง |
| `feature/waitlist` | "แจ้งเตือนเมื่อห้องว่าง" ต่อประเภทห้อง |
| `feature/owner-verify` | owner ส่งเอกสารยืนยันตัวตน/สิทธิ์ → admin อนุมัติ → badge Verified |
| `feature/reviews` | รีวิวได้เฉพาะคนที่มี booking confirmed |
| `feature/anti-scam` | คำเตือนในแชทเมื่อมีการพูดถึงโอนเงินนอกระบบ, ปุ่มรายงานประกาศ |
| `feature/admin-panel` | หน้า admin: อนุมัติ verify, จัดการรายงาน |

## Phase 5 – Smart features → v1.2.0

| Feature branch | งาน |
|----------------|-----|
| `feature/commute-search` | ค้นหาตามเวลาเดินทางไปที่เรียน/ที่ทำงาน |
| `feature/ai-auto-reply` | AI ตอบคำถามจากข้อมูลหอเมื่อ owner ออฟไลน์ แล้วส่งต่อเมื่อถึงขั้นจอง |
| `feature/owner-insights` | แดชบอร์ด: ยอดเข้าชม, แชท→จอง, อัตราเข้าพัก, ราคาเทียบหอใกล้เคียง |
| `feature/roommate-match` | จับคู่เพื่อนร่วมห้องตามไลฟ์สไตล์ |
| `feature/promptpay-deposit` | จ่ายมัดจำผ่าน PromptPay QR + แนบสลิป |
