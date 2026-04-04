import Link from "next/link";
import type { ChatHeaderData } from "@/lib/chat/types";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  conversation: ChatHeaderData;
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

export function ChatHeader({ conversation }: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-[#e3e3e3] bg-[#f3f3f3]/95 px-3 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3">
        <Link
          aria-label="Back to inbox"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#b7b7b7] bg-white text-[#171616]"
          href="/inbox"
        >
          <svg
            fill="none"
            height="18"
            viewBox="0 0 18 18"
            width="18"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11.25 3.75L6 9L11.25 14.25"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>
        </Link>

        <div className="min-w-0 rounded-full border border-[#b7b7b7] bg-white px-4 py-2 text-center">
          <p className="truncate text-[15px] font-semibold leading-5 text-[#171616]">
            {conversation.displayName}
          </p>
        </div>

        <div
          className={cn(
            "flex h-[43px] w-[43px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold text-[#171616]",
            getAvatarBackground(conversation.avatarSeed)
          )}
        >
          {conversation.initials}
        </div>
      </div>
    </header>
  );
}
