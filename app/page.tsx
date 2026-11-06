import { Suspense } from "react";
import type { Metadata } from "next";
import { FaqList } from "./(landing)/faq";
import { FinalCta } from "./(landing)/final-cta";
import { Hero } from "./(landing)/hero";
import { HowItWorks, HowItWorksFromUrl } from "./(landing)/how-it-works";
import { LandingJsonLd } from "./(landing)/json-ld";
import { LiveStats } from "./(landing)/live-stats";
import { OwnerSection } from "./(landing)/owner-section";
import { PopularAreas } from "./(landing)/popular-areas";
import { ProblemSolution } from "./(landing)/problem-solution";
import { Safety } from "./(landing)/safety";
import { LandingSection } from "./(landing)/section";
import { TenantFeatures } from "./(landing)/tenant-features";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "th_TH",
    siteName: "DormDee",
    title: "DormDee – หาหอพัก ห้องว่างจริง จองผ่านแชท",
    description:
      "ค้นหาหอพักและอพาร์ตเมนต์ เห็นห้องว่างจริงแบบ real-time ค่าใช้จ่ายโปร่งใส และจองกับเจ้าของหอได้ทันทีผ่านแชท",
  },
};

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <>
      <LandingJsonLd />
      <Hero />
      <LiveStats />
      <ProblemSolution />
      <TenantFeatures />
      <LandingSection id="how-it-works" title="ใช้งานยังไง">
        {/* `?for=owner` is request data, so only this block streams; the rest of the page stays static. */}
        <Suspense fallback={<HowItWorks />}>
          <HowItWorksFromUrl searchParams={searchParams} />
        </Suspense>
      </LandingSection>
      <OwnerSection />
      <PopularAreas />
      <Safety />
      <LandingSection id="faq" title="คำถามที่พบบ่อย">
        <FaqList />
      </LandingSection>
      <FinalCta />
    </>
  );
}
