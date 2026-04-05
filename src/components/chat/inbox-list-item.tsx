import Link from "next/link";
import { cn } from "@/lib/utils";
import type { InboxConversationItemData } from "@/lib/chat/types";

interface InboxListItemProps {
  conversation: InboxConversationItemData;
  isLast?: boolean;
}

const avatarBackgrounds = [
  "from-[#f2d0c3] via-[#e2a272] to-[#cf7033]",
  "from-[#ffb16a] via-[#ef6331] to-[#cc371f]",
  "from-[#dbe7ef] via-[#7da7c8] to-[#426485]",
  "from-[#f2d6b2] via-[#d39d54] to-[#895b21]",
  "from-[#ded8f1] via-[#a0a7d9] to-[#6568a7]",
  "from-[#eee1d2] via-[#c9a88f] to-[#826858]",
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
          <div
            className={cn(
              "flex size-[52px] items-center justify-center rounded-full bg-gradient-to-br text-[14px] font-semibold text-white",
              getAvatarBackground(conversation.avatarSeed)
            )}
          >
            {conversation.initials}
          </div>

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
