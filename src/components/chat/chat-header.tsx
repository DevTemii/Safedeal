import Link from "next/link";
import { InboxAvatar } from "@/components/chat/inbox-avatar";
import type { ChatHeaderData } from "@/lib/chat/types";

interface ChatHeaderProps {
  conversation: ChatHeaderData;
}

export function ChatHeader({ conversation }: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-[#e3e3e3] bg-white px-[13px] pb-[15px] pt-[calc(env(safe-area-inset-top)+14px)]">
      <div className="flex items-center justify-between gap-[10px]">
        <Link
          aria-label="Back to inbox"
          className="flex h-[34px] w-[49px] shrink-0 items-center justify-center rounded-[22px] border border-[#979797] bg-white text-black"
          href="/inbox"
        >
          <svg
            fill="none"
            height="24"
            viewBox="0 0 24 24"
            width="24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 6L9 12L15 18"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>
        </Link>

        <div className="flex h-[34px] min-w-0 flex-1 items-center justify-center rounded-[22px] border border-[#979797] bg-white px-4 text-center">
          <p className="truncate text-[14px] font-semibold leading-none text-black">
            {conversation.displayName}
          </p>
        </div>

        <InboxAvatar
          initials={conversation.initials}
          seed={conversation.avatarSeed}
          sizeClassName="size-[43px]"
          textClassName="text-[12px] font-semibold"
        />
      </div>
    </header>
  );
}
