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

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col">
        <header className="px-4 pb-5 pt-[calc(env(safe-area-inset-top)+1rem)]">
          <h1 className="text-center text-[33px] font-bold tracking-[-0.03em] text-[#171616]">
            Chats
          </h1>
          <p className="mt-2 text-center text-[13px] leading-5 text-[#878787]">
            {shortenWallet(profile.wallet_address)}
          </p>
        </header>

        <InboxList conversations={items} />
      </div>
    </main>
  );
}
