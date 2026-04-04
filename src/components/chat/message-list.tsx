import type { ChatMessageViewModel } from "@/lib/chat/types";
import { MessageBubble } from "@/components/chat/message-bubble";
import { SystemMessage } from "@/components/chat/system-message";

interface MessageListProps {
  currentUserId: string;
  messages: ChatMessageViewModel[];
}

function formatDayLabel(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function MessageList({ currentUserId, messages }: MessageListProps) {
  if (!messages.length) {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="max-w-xs text-center">
          <h2 className="text-[18px] font-semibold text-[#171616]">
            No messages yet
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#878787]">
            This conversation is ready for its first message. SafeDeal actions
            will appear here as the deal progresses.
          </p>
        </div>
      </div>
    );
  }

  let previousDayKey: string | null = null;

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-0 py-5">
      {messages.map((message) => {
        const dayLabel = formatDayLabel(message.createdAt);
        const dayKey = dayLabel ?? null;
        const showDayLabel = Boolean(dayKey && dayKey !== previousDayKey);
        previousDayKey = dayKey;

        return (
          <div className="space-y-3" key={message.id}>
            {showDayLabel ? <SystemMessage>{dayLabel!}</SystemMessage> : null}
            <MessageBubble currentUserId={currentUserId} message={message} />
          </div>
        );
      })}
    </div>
  );
}
