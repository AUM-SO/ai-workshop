"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RiAlertLine, RiArrowLeftLine, RiSendPlane2Fill } from "@remixicon/react";
import { Button, ButtonLink } from "@/components/base/buttons/button";
import { ScrollFade, useScrollFade } from "@/components/foundations/scroll-fade/scroll-fade";
import { markConversationRead, sendMessage } from "@/app/chat/actions";
import type { Thread } from "@/lib/chat/queries";
import { mentionsOffPlatformPayment } from "@/lib/chat/safety";
import { createClient } from "@/lib/supabase/client";
import { cx } from "@/utils/cx";
import { BookingCard } from "./booking-card";
import { BookingRequestDialog } from "./booking-request-dialog";

type Message = Thread["messages"][number];
type Booking = Thread["bookings"][number];

const timeFormat = new Intl.DateTimeFormat("th-TH", {
  hour: "2-digit",
  minute: "2-digit",
});
const dayFormat = new Intl.DateTimeFormat("th-TH", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

interface ChatThreadProps {
  thread: Thread;
  userId: string;
  /** Room type to open the booking dialog with (from the dorm page). */
  bookTypeId?: string;
}

export function ChatThread({ thread, userId, bookTypeId }: ChatThreadProps) {
  const router = useRouter();
  const { conversation, role, dorm } = thread;
  const [messages, setMessages] = useState<Message[]>(thread.messages);
  const [bookings, setBookings] = useState<Booking[]>(thread.bookings);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, startSending] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fade = useScrollFade();

  // Server refreshes (after a booking action) bring new props; adopt them.
  const [seen, setSeen] = useState(thread);
  if (seen !== thread) {
    setSeen(thread);
    setMessages(thread.messages);
    setBookings(thread.bookings);
  }

  // Live updates for this conversation.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat:${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const message = payload.new as Message;
          setMessages((list) => (list.some((m) => m.id === message.id) ? list : [...list, message]));
          if (message.sender_id !== userId) void markConversationRead(conversation.id);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const booking = payload.new as Booking;
          setBookings((list) => (list.some((b) => b.id === booking.id) ? list.map((b) => (b.id === booking.id ? booking : b)) : [...list, booking]));
          // Room lists for the owner's picker come from the server.
          if (role === "owner") router.refresh();
        },
      )
      .subscribe();
    void markConversationRead(conversation.id);
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversation.id, userId, role, router]);

  // Keep the newest message in view.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const typeName = useMemo(() => new Map(thread.roomTypes.map((t) => [t.id, t.name])), [thread.roomTypes]);
  const roomNo = useMemo(() => new Map(thread.rooms.map((r) => [r.id, r.room_no])), [thread.rooms]);
  const bookingById = useMemo(() => new Map(bookings.map((b) => [b.id, b])), [bookings]);
  const hasOpenBooking = bookings.some((b) => b.status === "pending" || b.status === "held");

  const send = () => {
    const body = draft.trim();
    if (!body || sending) return;
    startSending(async () => {
      setError(null);
      const result = await sendMessage(conversation.id, body);
      if (result.error) setError(result.error);
      else setDraft("");
    });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send();
    }
  };

  const otherName = role === "owner" ? thread.tenantName : thread.ownerName;
  const dayOf = (m: Message) => dayFormat.format(new Date(m.created_at));

  return (
    <div className="flex h-[calc(100dvh-10rem)] min-h-[28rem] flex-col overflow-hidden rounded-3xl border border-border-button-default bg-background-primary-default shadow-md">
      <header className="flex items-center gap-3 border-b border-separator-border px-4 py-3">
        <ButtonLink
          href="/chat"
          variant="ghost"
          size="small"
          iconOnly
          leadingIcon={RiArrowLeftLine}
          aria-label="กลับไปกล่องข้อความ"
          className="rtl:-scale-x-100"
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-headline-semibold text-text-primary">{otherName}</span>
          {dorm ? (
            <Link
              href={`/dorms/${dorm.id}`}
              className="truncate rounded-sm text-caption-1-regular text-text-secondary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-border-focus-ring"
            >
              {dorm.name}
            </Link>
          ) : null}
        </div>
        {role === "tenant" ? (
          <BookingRequestDialog
            conversationId={conversation.id}
            roomTypes={thread.roomTypes}
            initialTypeId={bookTypeId}
            disabled={hasOpenBooking || dorm?.status !== "published"}
          />
        ) : null}
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={fade.onScroll}
          className="flex h-full flex-col gap-3 overflow-y-auto px-4 py-4"
          role="log"
          aria-label={`ข้อความกับ ${otherName}`}
          aria-live="polite"
        >
          {messages.length === 0 ? (
            <p className="m-auto max-w-xs text-center text-body-regular text-text-secondary">
              {role === "tenant" ? "เริ่มคุยกับเจ้าของหอ ถามเรื่องห้อง หรือกด “ขอจองห้อง” ได้เลย" : "ยังไม่มีข้อความ"}
            </p>
          ) : null}
          {messages.map((message, i) => {
            const day = dayOf(message);
            const showDay = i === 0 || day !== dayOf(messages[i - 1]);
            const mine = message.sender_id === userId;
            const booking = message.booking_id ? bookingById.get(message.booking_id) : undefined;

            return (
              <div key={message.id} className="flex flex-col gap-3">
                {showDay ? <p className="self-center text-caption-1-medium text-text-tertiary">{day}</p> : null}
                {message.kind === "system" ? (
                  <p className="self-center rounded-full bg-background-tertiary-default px-3 py-1 text-center text-caption-1-medium text-text-secondary">
                    {message.body}
                  </p>
                ) : message.kind === "booking" && booking ? (
                  <div className={cx("flex", mine ? "justify-end" : "justify-start")}>
                    <BookingCard
                      booking={booking}
                      role={role}
                      roomTypeName={typeName.get(booking.room_type_id) ?? "ห้อง"}
                      promptpayId={dorm?.promptpay_id}
                      deposit={thread.roomTypes.find((t) => t.id === booking.room_type_id)?.deposit}
                      roomNo={booking.room_id ? roomNo.get(booking.room_id) : undefined}
                      rooms={thread.rooms
                        .filter((r) => r.room_type_id === booking.room_type_id && (r.status === "vacant" || r.id === booking.room_id))
                        .sort((a, b) =>
                          a.room_no.localeCompare(b.room_no, "th", {
                            numeric: true,
                          }),
                        )}
                    />
                  </div>
                ) : (
                  <div className={cx("flex max-w-[80%] flex-col gap-1", mine ? "items-end self-end" : "items-start self-start")}>
                    <p
                      className={cx(
                        "rounded-2xl px-3.5 py-2 text-body-regular whitespace-pre-wrap break-words",
                        mine ? "rounded-ee-md bg-accent-600 text-text-white" : "rounded-es-md bg-background-secondary-default text-text-primary",
                      )}
                    >
                      {message.body}
                    </p>
                    <span className="text-caption-2-regular text-text-tertiary">
                      {message.via ? "ตอบโดยผู้ช่วย AI · " : ""}
                      {timeFormat.format(new Date(message.created_at))}
                    </span>
                    {!mine && role === "tenant" && mentionsOffPlatformPayment(message.body) ? (
                      <p className="flex max-w-sm items-start gap-1.5 rounded-xl bg-status-yellow-background px-3 py-2 text-caption-1-medium text-status-yellow-text">
                        <RiAlertLine className="mt-0.5 size-4 shrink-0" aria-hidden />
                        ระวัง: อย่าโอนเงินมัดจำก่อนดูห้องจริงและก่อนเจ้าของหอยืนยันการจองในระบบ
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <ScrollFade progress={fade.progress} surfaceClassName="from-background-primary-default" />
      </div>

      <div className="flex flex-col gap-1 border-t border-separator-border p-3">
        <div className="flex items-end gap-2">
          <label htmlFor="chat-draft" className="sr-only">
            พิมพ์ข้อความ
          </label>
          <textarea
            id="chat-draft"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={2000}
            placeholder="พิมพ์ข้อความ… (Enter เพื่อส่ง, Shift+Enter ขึ้นบรรทัดใหม่)"
            className="max-h-36 min-h-10 flex-1 resize-none rounded-xl border border-border-button-default bg-background-primary-default px-3 py-2 text-body-regular text-text-primary outline-none [field-sizing:content] placeholder:text-text-placeholder focus-visible:ring-2 focus-visible:ring-border-focus-ring"
          />
          <Button iconOnly leadingIcon={RiSendPlane2Fill} aria-label="ส่งข้อความ" disabled={!draft.trim() || sending} onClick={send} />
        </div>
        {error ? (
          <p role="alert" className="text-caption-1-regular text-text-error-primary">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
