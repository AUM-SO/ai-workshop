import type { Metadata } from "next";
import { LegalPlaceholder } from "@/components/layout/legal-placeholder";

export const metadata: Metadata = { title: "เงื่อนไขการใช้งาน" };

export default function TermsPage() {
  return <LegalPlaceholder title="เงื่อนไขการใช้งาน" />;
}
