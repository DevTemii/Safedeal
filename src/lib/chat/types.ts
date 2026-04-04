export type MessageType =
  | "text"
  | "system"
  | "deal_suggestion"
  | "deal_card"
  | "payment_event"
  | "delivery_event";

export type MessageMetadata = Record<string, unknown>;

export interface InboxConversationItemData {
  conversationId: string;
  displayName: string;
  initials: string;
  avatarSeed: string;
  href: string;
  lastMessageAt: string | null;
  lastMessagePreview: string;
  unreadCount: number;
}

export interface ChatHeaderData {
  conversationId: string;
  displayName: string;
  initials: string;
  avatarSeed: string;
}

export interface ChatMessageViewModel {
  id: string;
  body: string;
  createdAt: string;
  metadata: MessageMetadata;
  senderId: string | null;
  type: MessageType;
}

export function isMessageMetadata(value: unknown): value is MessageMetadata {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getMessageType(metadata: unknown): MessageType {
  if (!isMessageMetadata(metadata)) {
    return "text";
  }

  const type = metadata.type;

  switch (type) {
    case "system":
    case "deal_suggestion":
    case "deal_card":
    case "payment_event":
    case "delivery_event":
      return type;
    default:
      return "text";
  }
}
