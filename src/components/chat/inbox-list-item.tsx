import Link from "next/link";
import { cn } from "@/lib/utils";
import type { InboxConversationItemData } from "@/lib/chat/types";

interface InboxListItemProps {
  conversation: InboxConversationItemData;
}

const avatarBackgrounds = [
  "from-[#FFE4DA] to-[#FFC6AE]",
  "from-[#DCE8FF] to-[#B8CFFF]",
  "from-[#E6F7EE] to-[#C2E7D1]",
  "from-[#FFF0C2] to-[#FFD788]",
  "from-[#F4E3FF] to-[#D7B8FF]",
];

function getAvatarBackground(seed: string) {
  const total = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return avatarBackgrounds[total % avatarBackgrounds.length];
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
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function InboxListItem({ conversation }: InboxListItemProps) {
  const timeLabel = formatTimeLabel(conversation.lastMessageAt);

  return (
    <Link
      className="flex items-start gap-3 border-b border-[#ececec] px-4 py-4 transition-colors hover:bg-[#fafafa]"
      href={conversation.href}
    >
      <div
        className={cn(
          "flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold text-[#171616]",
          getAvatarBackground(conversation.avatarSeed)
        )}
      >
        {conversation.initials}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[17px] font-bold leading-5 text-[#171616]">
              {conversation.displayName}
            </p>
            <p className="mt-1 truncate text-[13px] leading-5 text-[#878787]">
              {conversation.lastMessagePreview}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2 pt-0.5">
            {timeLabel ? (
              <span className="text-[12px] leading-none text-[#878787]">
                {timeLabel}
              </span>
            ) : null}

            {conversation.unreadCount > 0 ? (
              <span className="min-w-[24px] rounded-full bg-[#4038d9] px-2 py-1 text-center text-[10px] font-semibold leading-none text-white">
                {conversation.unreadCount}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
