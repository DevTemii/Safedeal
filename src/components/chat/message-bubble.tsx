import { DealSuggestionCard } from "@/components/chat/deal-suggestion-card";
import type { ChatMessageViewModel, MessageMetadata } from "@/lib/chat/types";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  currentUserId: string;
  message: ChatMessageViewModel;
  onIgnoreSuggestion?: (messageId: string) => void;
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

function formatStatusLabel(status: string | null) {
  if (!status) {
    return null;
  }

  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusBadgeClass(status: string | null) {
  switch (status?.toLowerCase()) {
    case "draft":
    case "approved":
      return "bg-[#eff2ff] text-[#2f48d6]";
    case "funding_pending":
    case "awaiting funding":
    case "awaiting_funding":
      return "bg-[#fff3dc] text-[#9c6a15]";
    case "funded":
    case "delivered":
    case "completed":
      return "bg-[#e9f7ef] text-[#21764d]";
    case "disputed":
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
    <div className="w-full max-w-[283px] rounded-tl-[13px] rounded-tr-[13px] rounded-bl-[13px] border border-[#E6E6E6] bg-[#F8F8F8] px-3 py-[10px] shadow-[0px_2px_18px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm text-white"
            style={{ backgroundColor: accent }}
          >
            &bull;
          </span>
          <p className="text-[12px] font-semibold leading-[18px] text-[#0F0F0F]">
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
            {formatStatusLabel(status)}
          </span>
        ) : null}
      </div>

      {body ? (
        <p className="mt-2 text-[12px] leading-[18px] text-[#0F0F0F]">{body}</p>
      ) : null}

      {description ? (
        <p className="mt-1 text-[12px] leading-[18px] text-[#979797]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function MessageBubble({
  currentUserId,
  message,
  onIgnoreSuggestion,
}: MessageBubbleProps) {
  const isOwnMessage = message.senderId === currentUserId;
  const alignmentClass = isOwnMessage ? "justify-end" : "justify-start";

  switch (message.type) {
    case "system":
      return (
        <div className="flex justify-center">
          <div className="rounded-[22px] border border-[#979797] bg-white px-3 py-1">
            <span className="text-[10px] font-semibold leading-none text-black">
              {message.body}
            </span>
          </div>
        </div>
      );
    case "deal_suggestion":
      return (
        <div className="flex justify-end">
          <DealSuggestionCard
            body={message.body}
            metadata={message.metadata}
            onIgnore={() => onIgnoreSuggestion?.(message.id)}
          />
        </div>
      );
    case "deal_card":
      return (
        <div className={cn("flex", alignmentClass)}>
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
        <div className={cn("flex", alignmentClass)}>
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
        <div className={cn("flex", alignmentClass)}>
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
        <div className={cn("flex", alignmentClass)}>
          <div
            className={cn(
              "w-fit max-w-[280px] px-[10px] text-[12px] font-normal leading-[24px] shadow-[0px_1px_2px_rgba(0,0,0,0.02)]",
              isOwnMessage
                ? "rounded-bl-[16px] rounded-tl-[16px] rounded-tr-[16px] rounded-br-[4px] bg-[#002DE3] text-white"
                : "rounded-br-[16px] rounded-tl-[16px] rounded-tr-[16px] rounded-bl-[4px] bg-[#E6E6E6] py-[2px] text-[#0F0F0F]"
            )}
          >
            {message.body}
          </div>
        </div>
      );
  }
}
