import { RiCheckboxCircleLine } from "@remixicon/react";
import { LandingSection, revealDelay } from "./section";

const ITEMS = [
  {
    problem: "ทักไปแล้วห้องเต็ม ประกาศค้างเป็นเดือน",
    solution: "สถานะห้องมาจากระบบจัดการหอโดยตรง ห้องไหนถูกจอง ประกาศเปลี่ยนทันที",
  },
  {
    problem: "ไปถึงวันเข้าอยู่แล้วเจอค่าใช้จ่ายเพิ่ม",
    solution: "แสดงเงินวันเข้าอยู่ และค่าน้ำค่าไฟโดยประมาณก่อนตัดสินใจ",
  },
  {
    problem: "โดนหลอกโอนมัดจำก่อนดูห้อง",
    solution: "การจองยืนยันในระบบ ไม่ต้องโอนเงินให้ใครก่อนเจ้าของหอยืนยัน",
  },
];

export function ProblemSolution() {
  return (
    <LandingSection id="why" title="หาหอเองเหนื่อยตรงไหน DormDee แก้ให้">
      <ul className="grid gap-4 md:grid-cols-3">
        {ITEMS.map(({ problem, solution }, index) => (
          <li
            key={problem}
            data-reveal
            style={revealDelay(index)}
            className="flex flex-col gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-6"
          >
            <p className="text-body-regular text-text-tertiary line-through decoration-text-placeholder">{problem}</p>
            <p className="flex gap-2 text-headline-medium text-text-primary">
              <RiCheckboxCircleLine className="mt-0.5 size-5 shrink-0 text-status-lime-text" aria-hidden />
              {solution}
            </p>
          </li>
        ))}
      </ul>
    </LandingSection>
  );
}
