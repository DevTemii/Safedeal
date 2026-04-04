import type { InboxConversationItemData } from "@/lib/chat/types";
import { InboxListItem } from "@/components/chat/inbox-list-item";

interface InboxListProps {
  conversations: InboxConversationItemData[];
}

export function InboxList({ conversations }: InboxListProps) {
  if (!conversations.length) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-xs rounded-[24px] border border-[#ececec] bg-white px-6 py-8 text-center shadow-[0px_10px_40px_rgba(0,0,0,0.04)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f2f5ff] text-xl">
            💬
          </div>
          <h2 className="mt-4 text-[18px] font-semibold text-[#171616]">
            No chats yet
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#878787]">
            Your protected conversations will appear here once a buyer or seller
            starts chatting with you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-t-[28px] border-t border-[#ececec] bg-white">
      {conversations.map((conversation) => (
        <InboxListItem
          conversation={conversation}
          key={conversation.conversationId}
        />
      ))}
    </div>
  );
}
