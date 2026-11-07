import type { Metadata } from "next";
import { LegalPlaceholder } from "@/components/layout/legal-placeholder";

export const metadata: Metadata = { title: "นโยบายความเป็นส่วนตัว" };

export default function PrivacyPage() {
  return <LegalPlaceholder title="นโยบายความเป็นส่วนตัว" />;
}
