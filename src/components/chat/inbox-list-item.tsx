import { InboxAvatar } from "@/components/chat/inbox-avatar";
import Link from "next/link";
import type { InboxConversationItemData } from "@/lib/chat/types";

interface InboxListItemProps {
  conversation: InboxConversationItemData;
  isLast?: boolean;
}

function formatTimeLabel(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function InboxListItem({
  conversation,
  isLast = false,
}: InboxListItemProps) {
  const timeLabel = formatTimeLabel(conversation.lastMessageAt);

  return (
    <div>
      <Link
        className="block"
        href={conversation.href}
      >
        <div className="grid min-h-[52px] grid-cols-[52px_minmax(0,1fr)_40px] items-start gap-x-[11px]">
          <InboxAvatar
            initials={conversation.initials}
            seed={conversation.avatarSeed}
            sizeClassName="size-[52px]"
          />

          <div className="min-w-0 pt-[6px]">
            <p className="truncate text-[15px] font-bold leading-none text-[#171616]">
              {conversation.displayName}
            </p>
            <p className="mt-[8px] truncate text-[12px] font-medium leading-none text-[#878787]">
              {conversation.lastMessagePreview}
            </p>
          </div>

          <div className="flex min-h-[52px] shrink-0 flex-col items-end pt-[7px]">
            {timeLabel ? (
              <span className="text-[12px] font-medium leading-none text-[#878787]">
                {timeLabel}
              </span>
            ) : null}

            {conversation.unreadCount > 0 ? (
              <span className="mt-[12px] flex h-4 min-w-6 items-center justify-center rounded-[10px] bg-[#4038d9] px-[6px] text-center text-[10px] font-medium leading-none text-white">
                {conversation.unreadCount}
              </span>
            ) : null}
          </div>
        </div>
      </Link>

      {!isLast ? <div className="ml-[57px] mt-[7px] h-px bg-[#e3e3e3]" /> : null}
    </div>
  );
}
