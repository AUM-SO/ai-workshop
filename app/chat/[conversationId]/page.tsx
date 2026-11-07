import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatThread } from "@/components/chat/chat-thread";
import { requireProfile } from "@/lib/auth";
import { getThread } from "@/lib/chat/queries";

export const metadata: Metadata = { title: "แชท" };

export default function ChatThreadPage(props: PageProps<"/chat/[conversationId]">) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-4 py-6">
      <Suspense fallback={<div className="h-[60vh]" aria-hidden />}>
        <ThreadContent {...props} />
      </Suspense>
    </div>
  );
}

async function ThreadContent({ params, searchParams }: PageProps<"/chat/[conversationId]">) {
  const [{ conversationId }, { book }] = await Promise.all([params, searchParams]);
  const profile = await requireProfile(`/chat/${conversationId}`);
  const thread = await getThread(conversationId, profile.id);
  if (!thread) notFound();
  return <ChatThread thread={thread} userId={profile.id} bookTypeId={typeof book === "string" ? book : undefined} />;
}
