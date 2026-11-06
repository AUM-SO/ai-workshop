import { RiChat3Line, RiLayoutGridLine, RiWallet3Line } from "@remixicon/react";
import { ButtonLink } from "@/components/base/buttons/button";

const highlights = [
  {
    icon: RiLayoutGridLine,
    title: "ห้องว่างจริง",
    description: "ผังห้องอัปเดตแบบ real-time ไม่มีประกาศค้าง",
  },
  {
    icon: RiChat3Line,
    title: "จองผ่านแชท",
    description: "คุยกับเจ้าของหอและส่งคำขอจองได้ในที่เดียว",
  },
  {
    icon: RiWallet3Line,
    title: "ค่าใช้จ่ายโปร่งใส",
    description: "เห็นเงินที่ต้องจ่ายวันเข้าอยู่และค่าน้ำค่าไฟก่อนตัดสินใจ",
  },
];

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-16">
      <section className="flex flex-col items-start gap-6">
        <h1 className="max-w-2xl text-title-1-medium text-text-primary">
          หาหอพักที่ว่างจริง และจองได้ทันทีผ่านแชท
        </h1>
        <p className="max-w-xl text-body-regular text-text-secondary">
          ค้นหาหอใกล้มหาวิทยาลัย ที่ทำงาน หรือรถไฟฟ้า เปรียบเทียบค่าใช้จ่ายทั้งหมด แล้วคุยกับเจ้าของหอโดยตรง
        </p>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/search">ค้นหาหอพัก</ButtonLink>
          <ButtonLink href="/signup?role=owner" variant="secondary">
            ลงประกาศหอพักฟรี
          </ButtonLink>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {highlights.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="flex flex-col gap-2 rounded-3xl border border-border-button-default bg-background-primary-default p-6"
          >
            <Icon className="size-6 text-foreground-icon-primary" aria-hidden />
            <h2 className="text-headline-semibold text-text-primary">{title}</h2>
            <p className="text-body-regular text-text-secondary">{description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
