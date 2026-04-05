import type { InboxConversationItemData } from "@/lib/chat/types";
import { InboxListItem } from "@/components/chat/inbox-list-item";
import { cn } from "@/lib/utils";

interface InboxListProps {
  conversations: InboxConversationItemData[];
}

const storyFallbacks = [
  { avatarSeed: "blessing-cakes", initials: "BC" },
  { avatarSeed: "tobi-dev", initials: "TD" },
  { avatarSeed: "kemi-ui", initials: "KU" },
  { avatarSeed: "ada-designs", initials: "AD" },
  { avatarSeed: "fauna-blockchain-dev", initials: "FB" },
  { avatarSeed: "zainab-store", initials: "ZS" },
];

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

function ChatIcon({ active = false }: { active?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={cn("size-[21px]", active ? "text-[#012de3]" : "text-[#555555]")}
      fill={active ? "currentColor" : "none"}
      viewBox="0 0 24 24"
    >
      <path
        d="M7 18.5C5.61929 18.5 4.5 17.3807 4.5 16V7C4.5 5.61929 5.61929 4.5 7 4.5H17C18.3807 4.5 19.5 5.61929 19.5 7V16C19.5 17.3807 18.3807 18.5 17 18.5H10.1538L7.04361 20.8327C6.71353 21.0803 6.25 20.8448 6.25 20.4322V18.5H7Z"
        stroke={active ? "none" : "currentColor"}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function DealsIcon() {
  return (
    <svg aria-hidden="true" className="size-[21px] text-[#555555]" fill="none" viewBox="0 0 24 24">
      <path
        d="M8 4.75H16M8 9.75H16M8 14.75H13M6.75 20.25H17.25C18.4926 20.25 19.5 19.2426 19.5 18V6C19.5 4.75736 18.4926 3.75 17.25 3.75H6.75C5.50736 3.75 4.5 4.75736 4.5 6V18C4.5 19.2426 5.50736 20.25 6.75 20.25Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg aria-hidden="true" className="size-[21px] text-[#555555]" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="7.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 8V12L14.75 14.25" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg aria-hidden="true" className="size-[21px] text-[#555555]" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 12C13.7949 12 15.25 10.5449 15.25 8.75C15.25 6.95507 13.7949 5.5 12 5.5C10.2051 5.5 8.75 6.95507 8.75 8.75C8.75 10.5449 10.2051 12 12 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M5.75 18.25C6.54774 15.9783 8.71126 14.5 12 14.5C15.2887 14.5 17.4523 15.9783 18.25 18.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function InboxList({ conversations }: InboxListProps) {
  const storyItems = conversations.slice(0, 6).map((conversation) => ({
    avatarSeed: conversation.avatarSeed,
    initials: conversation.initials,
    key: conversation.conversationId,
  }));

  for (const fallback of storyFallbacks) {
    if (storyItems.length >= 6) {
      break;
    }

    if (storyItems.some((item) => item.avatarSeed === fallback.avatarSeed)) {
      continue;
    }

    storyItems.push({
      ...fallback,
      key: `story-fallback-${fallback.avatarSeed}`,
    });
  }

  return (
    <main className="min-h-screen bg-white text-[#171616]">
      <div className="mx-auto flex min-h-screen w-full max-w-[393px] flex-col bg-white">
        <div className="flex-1 pb-[92px]">
          <header className="px-[14px] pt-[calc(env(safe-area-inset-top)+50px)]">
            <h1 className="text-center text-[23px] font-bold leading-none tracking-[-0.02em] text-black">
              Chats
            </h1>

            <div className="mt-[18px] flex h-[41px] items-center justify-center rounded-[22px] border border-[#b7b7b7] bg-white">
              <div className="flex items-center gap-1 text-[#424242]">
                <svg
                  aria-hidden="true"
                  className="size-4 shrink-0"
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
                  className="w-[120px] bg-transparent text-[14px] font-medium leading-none text-[#424242] outline-none placeholder:text-[#424242]"
                  placeholder="Search Chats"
                  type="search"
                />
              </div>
            </div>
          </header>

          <div className="mt-[15px] overflow-x-auto px-[14px]">
            <div className="flex min-w-max items-center gap-2">
              {storyItems.map((conversation) => (
                <div
                  className={cn(
                    "flex size-[63px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[15px] font-semibold text-white shadow-[0_2px_10px_rgba(0,0,0,0.08)]",
                    getStoryBackground(conversation.avatarSeed)
                  )}
                  key={conversation.key}
                >
                  {conversation.initials}
                </div>
              ))}
            </div>
          </div>

          <div className="mx-[16px] mt-[12px] h-px bg-[#e3e3e3]" />

          <div className="space-y-[17px] px-[14px] pt-[17px]">
            {conversations.map((conversation, index) => (
              <InboxListItem
                conversation={conversation}
                isLast={index === conversations.length - 1}
                key={conversation.conversationId}
              />
            ))}
          </div>
        </div>

        <nav className="sticky bottom-0 border-t border-[#e3e3e3] bg-[#f3f3f3] pb-[calc(env(safe-area-inset-bottom)+15px)]">
          <div className="flex h-[46px] items-center justify-between">
            <div className="flex w-[78px] flex-col items-center gap-px px-[26px] py-2">
              <ChatIcon active />
              <span className="text-center text-[8px] font-bold tracking-[0.08px] text-[#012de3]">
                Chats
              </span>
            </div>
            <div className="flex w-[78px] flex-col items-center gap-px px-[26px] py-2">
              <DealsIcon />
              <span className="text-center text-[8px] font-bold tracking-[0.08px] text-[#555555]">
                Deals
              </span>
            </div>
            <div className="flex w-[78px] flex-col items-center gap-px px-[26px] py-2">
              <HistoryIcon />
              <span className="text-center text-[8px] font-bold tracking-[0.08px] text-[#555555]">
                History
              </span>
            </div>
            <div className="flex w-[78px] flex-col items-center gap-px px-[26px] py-2">
              <ProfileIcon />
              <span className="text-center text-[8px] font-bold tracking-[0.08px] text-[#555555]">
                Profile
              </span>
            </div>
          </div>

          <div className="relative h-5">
            <div className="absolute bottom-0 left-1/2 h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-black" />
          </div>
        </nav>
      </div>
    </main>
  );
}
