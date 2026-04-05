import Link from "next/link";
import { cn } from "@/lib/utils";
import type { InboxConversationItemData } from "@/lib/chat/types";

interface InboxListItemProps {
  conversation: InboxConversationItemData;
  isLast?: boolean;
}

const avatarBackgrounds = [
  "from-[#f4d0c3] via-[#dda278] to-[#c86c31]",
  "from-[#ffb26f] via-[#ef6030] to-[#cf2f1e]",
  "from-[#d6e7ef] via-[#7aa8cb] to-[#355f8f]",
  "from-[#f3d6af] via-[#d29d52] to-[#8a5a20]",
  "from-[#ddd7f2] via-[#9ca5d6] to-[#5c64a4]",
  "from-[#efe2d3] via-[#caa98f] to-[#7e6455]",
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
        className="block rounded-[18px] transition-colors hover:bg-[#fafafa]"
        href={conversation.href}
      >
        <div className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-start gap-x-[11px]">
          <div
            className={cn(
              "flex size-[52px] items-center justify-center rounded-full bg-gradient-to-br text-[14px] font-semibold text-white",
              getAvatarBackground(conversation.avatarSeed)
            )}
          >
            {conversation.initials}
          </div>

          <div className="min-w-0 pt-[2px]">
            <p className="truncate text-[15px] font-bold leading-[1.15] text-[#171616]">
              {conversation.displayName}
            </p>
            <p className="mt-[7px] truncate text-[12px] font-medium leading-[1.2] text-[#878787]">
              {conversation.lastMessagePreview}
            </p>
          </div>

          <div className="flex min-h-[52px] shrink-0 flex-col items-end justify-start pt-[1px]">
            {timeLabel ? (
              <span className="text-[12px] font-medium leading-none text-[#878787]">
                {timeLabel}
              </span>
            ) : null}

            {conversation.unreadCount > 0 ? (
              <span className="mt-[14px] flex h-4 min-w-6 items-center justify-center rounded-[10px] bg-[#4038d9] px-[6px] text-center text-[10px] font-medium leading-none text-white">
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
