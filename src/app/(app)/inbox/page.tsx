import { redirect } from "next/navigation";
import { InboxList } from "@/components/chat/inbox-list";
import type {
  InboxConversationItemData,
  MessageMetadata,
} from "@/lib/chat/types";
import { createClient } from "@/lib/supabase/server";

interface ProfileRow {
  id: string;
  wallet_address: string;
}

interface ConversationRow {
  id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
}

interface MessageRow {
  id: string;
  body: string;
  conversation_id: string;
  created_at: string;
  metadata: MessageMetadata | null;
  sender_id: string | null;
}

const fallbackConversations: InboxConversationItemData[] = [
  {
    avatarSeed: "blessing-cakes",
    conversationId: "fallback-1",
    displayName: "Blessing Cakes",
    href: "/inbox",
    initials: "BC",
    lastMessageAt: "2026-04-05T11:34:00.000Z",
    lastMessagePreview: "Delivery will be tomorrow morning",
    unreadCount: 1,
  },
  {
    avatarSeed: "tobi-dev",
    conversationId: "fallback-2",
    displayName: "Tobi (Dev)",
    href: "/inbox",
    initials: "TD",
    lastMessageAt: "2026-04-05T20:12:00.000Z",
    lastMessagePreview: "So $300 for the landing page, right?",
    unreadCount: 2,
  },
  {
    avatarSeed: "tunde-logistics",
    conversationId: "fallback-3",
    displayName: "Tunde Logistics",
    href: "/inbox",
    initials: "TL",
    lastMessageAt: "2026-04-05T12:13:00.000Z",
    lastMessagePreview: "Package has been dispatched",
    unreadCount: 2,
  },
  {
    avatarSeed: "kemi-ui",
    conversationId: "fallback-4",
    displayName: "Kemi UI",
    href: "/inbox",
    initials: "KU",
    lastMessageAt: "2026-04-05T15:33:00.000Z",
    lastMessagePreview: "Payment is secured, I’m working on it...",
    unreadCount: 3,
  },
  {
    avatarSeed: "ada-designs",
    conversationId: "fallback-5",
    displayName: "Ada Designs",
    href: "/inbox",
    initials: "AD",
    lastMessageAt: "2026-04-05T05:09:00.000Z",
    lastMessagePreview: "I’ve created the deal, please confirm",
    unreadCount: 1,
  },
  {
    avatarSeed: "fauna-blockchain-dev",
    conversationId: "fallback-6",
    displayName: "Fauna (Blockchain dev)",
    href: "/inbox",
    initials: "FB",
    lastMessageAt: "2026-04-05T22:22:00.000Z",
    lastMessagePreview: "So $300 for the landing page, right?",
    unreadCount: 2,
  },
  {
    avatarSeed: "zainab-store",
    conversationId: "fallback-7",
    displayName: "Zainab Store",
    href: "/inbox",
    initials: "ZS",
    lastMessageAt: "2026-04-05T16:54:00.000Z",
    lastMessagePreview: "Thanks, payment received!",
    unreadCount: 0,
  },
];

function shortenWallet(value: string | null | undefined) {
  if (!value) {
    return "Unknown user";
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function getInitials(label: string) {
  const words = label
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (!words.length) {
    return "SD";
  }

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function getLastMessagePreview(message: MessageRow | undefined) {
  if (!message) {
    return "No messages yet";
  }

  const metadata = message.metadata ?? {};
  const type = metadata.type;

  switch (type) {
    case "system":
      return message.body || "System update";
    case "deal_suggestion":
      return "Suggested a deal";
    case "deal_card":
      return "Shared a deal card";
    case "payment_event":
      return "Updated payment status";
    case "delivery_event":
      return "Updated delivery status";
    default:
      return message.body || "New message";
  }
}

function getUnreadCount(message: MessageRow | undefined, currentUserId: string) {
  if (!message || message.sender_id === currentUserId) {
    return 0;
  }

  const metadata = message.metadata ?? {};
  const rawValue = metadata.unread_count ?? metadata.unreadCount;

  return typeof rawValue === "number" && rawValue > 0
    ? Math.floor(rawValue)
    : 0;
}

export default async function InboxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, wallet_address")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    redirect("/login");
  }

  const { data: conversations, error: conversationsError } = await supabase
    .from("conversations")
    .select("id, buyer_id, seller_id, last_message_at")
    .or(`buyer_id.eq.${profile.id},seller_id.eq.${profile.id}`)
    .order("last_message_at", { ascending: false });

  let items: InboxConversationItemData[] = [];

  if (!conversationsError && conversations?.length) {
    const otherParticipantIds = Array.from(
      new Set(
        conversations.map((conversation) =>
          conversation.buyer_id === profile.id
            ? conversation.seller_id
            : conversation.buyer_id
        )
      )
    );

    const { data: otherProfiles } = otherParticipantIds.length
      ? await supabase
          .from("profiles")
          .select("id, wallet_address")
          .in("id", otherParticipantIds)
      : { data: [] as ProfileRow[] };

    const { data: rawMessages } = await supabase
      .from("messages")
      .select("id, conversation_id, sender_id, body, metadata, created_at")
      .in(
        "conversation_id",
        conversations.map((conversation) => conversation.id)
      )
      .order("created_at", { ascending: false })
      .limit(Math.max(conversations.length * 5, 50));

    const latestMessageByConversation = new Map<string, MessageRow>();

    for (const message of (rawMessages ?? []) as MessageRow[]) {
      if (!latestMessageByConversation.has(message.conversation_id)) {
        latestMessageByConversation.set(message.conversation_id, message);
      }
    }

    const otherProfileById = new Map(
      ((otherProfiles ?? []) as ProfileRow[]).map((entry) => [entry.id, entry])
    );

    items = (conversations as ConversationRow[]).map((conversation) => {
      const counterpartId =
        conversation.buyer_id === profile.id
          ? conversation.seller_id
          : conversation.buyer_id;
      const counterpartProfile = otherProfileById.get(counterpartId);
      const displayName = shortenWallet(counterpartProfile?.wallet_address);
      const lastMessage = latestMessageByConversation.get(conversation.id);

      return {
        avatarSeed: counterpartId,
        conversationId: conversation.id,
        displayName,
        href: `/chat/${conversation.id}`,
        initials: getInitials(displayName),
        lastMessageAt: lastMessage?.created_at ?? conversation.last_message_at,
        lastMessagePreview: getLastMessagePreview(lastMessage),
        unreadCount: getUnreadCount(lastMessage, profile.id),
      };
    });
  }

  return <InboxList conversations={items.length ? items : fallbackConversations} />;
}
