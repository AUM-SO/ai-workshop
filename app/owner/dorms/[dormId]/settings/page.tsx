import { Suspense } from "react";
import type { Metadata } from "next";
import { BookingSettingsForm } from "@/components/dorm/booking-settings-form";
import { aiReplyAvailable } from "@/lib/chat/ai-reply";
import { getOwnedDorm } from "@/lib/dorms/owner";

export const metadata: Metadata = { title: "การรับจอง" };

export default function DormSettingsPage(props: PageProps<"/owner/dorms/[dormId]/settings">) {
  return (
    <Suspense fallback={null}>
      <Settings {...props} />
    </Suspense>
  );
}

async function Settings({ params }: PageProps<"/owner/dorms/[dormId]/settings">) {
  const { dormId } = await params;
  const dorm = await getOwnedDorm(dormId);
  return (
    <BookingSettingsForm
      dormId={dorm.id}
      promptpayId={dorm.promptpay_id}
      aiReplyEnabled={dorm.ai_reply_enabled}
      aiAvailable={aiReplyAvailable()}
    />
  );
}
