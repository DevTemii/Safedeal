"use client";

import { Fragment, useState } from "react";
import { DayDivider } from "@/components/chat/day-divider";
import { MessageBubble } from "@/components/chat/message-bubble";
import type { ChatMessageViewModel } from "@/lib/chat/types";

interface MessageListProps {
  currentUserId: string;
  messages: ChatMessageViewModel[];
}

function formatDayLabel(value: string) {
  const date = new Date(value);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (date.toDateString() === now.toDateString()) {
    return "Today";
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function MessageList({ currentUserId, messages }: MessageListProps) {
  const [dismissedSuggestionIds, setDismissedSuggestionIds] = useState<string[]>(
    []
  );

  const visibleMessages = messages.filter(
    (message) =>
      !(
        message.type === "deal_suggestion" &&
        dismissedSuggestionIds.includes(message.id)
      )
  );

  if (!messages.length) {
    return <div className="flex-1 overflow-y-auto bg-white px-[13px] pb-6 pt-[14px]" />;
  }

  let previousDayKey: string | null = null;
  let previousMessage: ChatMessageViewModel | null = null;

  return (
    <div className="flex-1 overflow-y-auto bg-white px-[13px] pb-6 pt-[14px]">
      {visibleMessages.map((message, index) => {
        const dayLabel = formatDayLabel(message.createdAt);
        const dayKey = dayLabel ?? null;
        const showDayLabel = Boolean(dayKey && dayKey !== previousDayKey);
        const isTightCluster =
          previousMessage?.type === "text" &&
          message.type === "text" &&
          previousMessage.senderId === message.senderId;
        const topSpacingClass = showDayLabel
          ? "mt-[14px]"
          : index === 0
            ? ""
            : isTightCluster
              ? "mt-px"
              : "mt-[10px]";

        previousDayKey = dayKey;
        previousMessage = message;

        return (
          <Fragment key={message.id}>
            {showDayLabel ? <DayDivider>{dayLabel!}</DayDivider> : null}
            <div className={topSpacingClass}>
              <MessageBubble
                currentUserId={currentUserId}
                message={message}
                onIgnoreSuggestion={(messageId) =>
                  setDismissedSuggestionIds((current) =>
                    current.includes(messageId)
                      ? current
                      : [...current, messageId]
                  )
                }
              />
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
