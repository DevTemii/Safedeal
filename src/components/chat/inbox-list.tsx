import type { InboxConversationItemData } from "@/lib/chat/types";
import { InboxListItem } from "@/components/chat/inbox-list-item";
import { cn } from "@/lib/utils";

interface InboxListProps {
  conversations: InboxConversationItemData[];
}

const storyBackgrounds = [
  "from-[#f7d8c7] via-[#eab188] to-[#d76d35]",
  "from-[#ffb36b] via-[#ef5f2f] to-[#d91e18]",
  "from-[#ffe6c7] via-[#dfa174] to-[#8a4f2f]",
  "from-[#f0d9c7] via-[#c99d74] to-[#705347]",
  "from-[#edc87f] via-[#ca8c3c] to-[#825316]",
  "from-[#d7dff9] via-[#9eb0f1] to-[#5869c8]",
];

function getStoryBackground(seed: string) {
  const total = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return storyBackgrounds[total % storyBackgrounds.length];
}

export function InboxList({ conversations }: InboxListProps) {
  const storyItems = conversations.slice(0, 6);

  return (
    <main className="min-h-screen bg-white text-[#171616]">
      <div className="mx-auto flex min-h-screen w-full max-w-[393px] flex-col bg-white pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <header className="px-[14px] pt-[calc(env(safe-area-inset-top)+28px)]">
          <h1 className="text-center text-[23px] font-bold leading-none tracking-[-0.02em] text-black">
            Chats
          </h1>

          <div className="relative mt-[27px]">
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#424242]"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                cx="11"
                cy="11"
                r="6.25"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M16 16L20 20"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.5"
              />
            </svg>
            <input
              aria-label="Search chats"
              className="h-[41px] w-full rounded-[22px] border border-[#b7b7b7] bg-white pl-10 pr-4 text-[14px] font-medium text-[#171616] outline-none placeholder:text-[#424242]"
              placeholder="Search Chats"
              type="search"
            />
          </div>
        </header>

        <div className="mt-[15px] overflow-x-auto px-[14px] scrollbar-none">
          <div className="flex min-w-max gap-2">
            {storyItems.map((conversation) => (
              <div
                className={cn(
                  "flex size-[63px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[15px] font-semibold text-white",
                  getStoryBackground(conversation.avatarSeed)
                )}
                key={`story-${conversation.conversationId}`}
              >
                {conversation.initials}
              </div>
            ))}
          </div>
        </div>

        <div className="mx-[16px] mt-[14px] h-px bg-[#e3e3e3]" />

        <div className="flex-1 px-[14px] pt-[17px]">
          {conversations.map((conversation, index) => (
            <InboxListItem
              conversation={conversation}
              isLast={index === conversations.length - 1}
              key={conversation.conversationId}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
