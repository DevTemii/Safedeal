import Image from "next/image";
import type { InboxConversationItemData } from "@/lib/chat/types";
import { InboxAvatar } from "@/components/chat/inbox-avatar";
import { InboxListItem } from "@/components/chat/inbox-list-item";

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
                <Image
                  alt=""
                  height={16}
                  src="/icons/solar_magnifer-outline.svg"
                  width={16}
                />
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
                  className="shrink-0"
                  key={conversation.key}
                >
                  <InboxAvatar
                    initials={conversation.initials}
                    seed={conversation.avatarSeed}
                    sizeClassName="size-[63px] shadow-[0_2px_10px_rgba(0,0,0,0.08)]"
                    textClassName="text-[15px] font-semibold"
                  />
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
              <Image
                alt=""
                height={21}
                src="/icons/fluent_chat-20-filled.svg"
                width={21}
              />
              <span className="text-center text-[8px] font-bold tracking-[0.08px] text-[#012de3]">
                Chats
              </span>
            </div>
            <div className="flex w-[78px] flex-col items-center gap-px px-[26px] py-2">
              <Image
                alt=""
                height={21}
                src="/icons/solar_document-outline.svg"
                width={21}
              />
              <span className="text-center text-[8px] font-bold tracking-[0.08px] text-[#555555]">
                Deals
              </span>
            </div>
            <div className="flex w-[78px] flex-col items-center gap-px px-[26px] py-2">
              <Image
                alt=""
                height={21}
                src="/icons/solar_clock-circle-outline.svg"
                width={21}
              />
              <span className="text-center text-[8px] font-bold tracking-[0.08px] text-[#555555]">
                History
              </span>
            </div>
            <div className="flex w-[78px] flex-col items-center gap-px px-[26px] py-2">
              <Image
                alt=""
                height={21}
                src="/icons/solar_user-outline.svg"
                width={21}
              />
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
