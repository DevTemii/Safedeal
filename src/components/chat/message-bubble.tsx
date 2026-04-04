import { cn } from "@/lib/utils";
import type { ChatMessageViewModel, MessageMetadata } from "@/lib/chat/types";
import { SystemMessage } from "@/components/chat/system-message";

interface MessageBubbleProps {
  currentUserId: string;
  message: ChatMessageViewModel;
}

function readText(metadata: MessageMetadata, key: string) {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readStatus(metadata: MessageMetadata) {
  return (
    readText(metadata, "statusLabel") ??
    readText(metadata, "status") ??
    readText(metadata, "badge")
  );
}

function statusBadgeClass(status: string | null) {
  switch (status?.toLowerCase()) {
    case "funded":
    case "secured":
    case "confirmed":
    case "completed":
      return "bg-[#e9f7ef] text-[#21764d]";
    case "pending":
    case "awaiting funding":
    case "awaiting_funding":
    case "submitted":
      return "bg-[#fff3dc] text-[#9c6a15]";
    case "disputed":
    case "open":
      return "bg-[#ffe7e7] text-[#b34040]";
    default:
      return "bg-[#eff2ff] text-[#2f48d6]";
  }
}

function EventCard({
  accent,
  body,
  description,
  status,
  title,
}: {
  accent: string;
  body?: string;
  description?: string | null;
  status?: string | null;
  title: string;
}) {
  return (
    <div className="max-w-[280px] rounded-[18px] border border-[#e7e7e7] bg-white px-4 py-3 shadow-[0px_8px_24px_rgba(0,0,0,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm text-white"
            style={{ backgroundColor: accent }}
          >
            •
          </span>
          <p className="text-[13px] font-semibold leading-5 text-[#171616]">
            {title}
          </p>
        </div>

        {status ? (
          <span
            className={cn(
              "rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.04em]",
              statusBadgeClass(status)
            )}
          >
            {status}
          </span>
        ) : null}
      </div>

      {body ? (
        <p className="mt-3 text-[13px] leading-5 text-[#171616]">{body}</p>
      ) : null}

      {description ? (
        <p className="mt-1 text-[12px] leading-5 text-[#878787]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function DealSuggestionCard({ metadata }: { metadata: MessageMetadata }) {
  const title =
    readText(metadata, "title") ??
    readText(metadata, "dealTitle") ??
    "Suggested deal";
  const amount =
    readText(metadata, "amountLabel") ??
    readText(metadata, "amount") ??
    readText(metadata, "priceLabel");
  const timing =
    readText(metadata, "targetDateLabel") ??
    readText(metadata, "deliveryWindow") ??
    readText(metadata, "timing");

  return (
    <div className="max-w-[285px] rounded-[18px] border border-[#3c4bff] bg-[#f6f7fb] px-4 py-4 shadow-[0px_12px_28px_rgba(0,0,0,0.08)]">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef0ff] text-[#002de3]">
          ✦
        </span>
        <div>
          <p className="text-[13px] font-semibold leading-5 text-[#171616]">
            Suggested
          </p>
          <p className="text-[12px] leading-4 text-[#878787]">
            Review the deal details before creating it.
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] leading-5 text-[#171616]">
        <span>{title}</span>
        {amount ? <span className="text-[#878787]">•</span> : null}
        {amount ? <span>{amount}</span> : null}
        {timing ? <span className="text-[#878787]">•</span> : null}
        {timing ? <span>{timing}</span> : null}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          className="rounded-full bg-[#002de3] px-4 py-2 text-[11px] font-semibold text-white"
          type="button"
        >
          Create Deal
        </button>
        <button
          className="rounded-full px-2 py-2 text-[11px] font-medium text-[#171616]"
          type="button"
        >
          Ignore
        </button>
      </div>
    </div>
  );
}

export function MessageBubble({ currentUserId, message }: MessageBubbleProps) {
  const isOwnMessage = message.senderId === currentUserId;
  const alignmentClass = isOwnMessage ? "justify-end" : "justify-start";

  switch (message.type) {
    case "system":
      return <SystemMessage>{message.body}</SystemMessage>;
    case "deal_suggestion":
      return (
        <div className={cn("flex px-4", alignmentClass)}>
          <DealSuggestionCard metadata={message.metadata} />
        </div>
      );
    case "deal_card":
      return (
        <div className={cn("flex px-4", alignmentClass)}>
          <EventCard
            accent="#002DE3"
            body={message.body}
            description={readText(message.metadata, "summary")}
            status={readStatus(message.metadata)}
            title={
              readText(message.metadata, "title") ??
              readText(message.metadata, "dealTitle") ??
              "Deal summary"
            }
          />
        </div>
      );
    case "payment_event":
      return (
        <div className={cn("flex px-4", alignmentClass)}>
          <EventCard
            accent="#0B57D0"
            body={message.body}
            description={readText(message.metadata, "description")}
            status={readStatus(message.metadata)}
            title="Secure payment"
          />
        </div>
      );
    case "delivery_event":
      return (
        <div className={cn("flex px-4", alignmentClass)}>
          <EventCard
            accent="#21764D"
            body={message.body}
            description={readText(message.metadata, "description")}
            status={readStatus(message.metadata)}
            title="Delivery update"
          />
        </div>
      );
    case "text":
    default:
      return (
        <div className={cn("flex px-4", alignmentClass)}>
          <div
            className={cn(
              "max-w-[280px] rounded-[18px] px-4 py-2 text-[13px] leading-6 shadow-[0px_4px_12px_rgba(0,0,0,0.02)]",
              isOwnMessage
                ? "rounded-br-[6px] bg-[#002de3] text-white"
                : "rounded-bl-[6px] bg-[#e9e9ea] text-[#0f0f0f]"
            )}
          >
            {message.body}
          </div>
        </div>
      );
  }
}
