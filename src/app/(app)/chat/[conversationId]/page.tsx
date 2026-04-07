import { notFound, redirect } from "next/navigation";
import { ChatHeader } from "@/components/chat/chat-header";
import { MessageInputBar } from "@/components/chat/message-input-bar";
import { MessageList } from "@/components/chat/message-list";
import {
  getMessageType,
  type ChatHeaderData,
  type ChatMessageViewModel,
  type MessageMetadata,
} from "@/lib/chat/types";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{
    conversationId: string;
  }>;
}

interface ProfileRow {
  id: string;
  wallet_address: string;
}

interface ConversationRow {
  id: string;
  buyer_id: string;
  seller_id: string;
}

interface MessageRow {
  id: string;
  body: string;
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

export default async function ChatPage({ params }: PageProps) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, wallet_address")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    redirect("/login");
  }

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id, buyer_id, seller_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (conversationError || !conversation) {
    notFound();
  }

  const currentConversation = conversation as ConversationRow;

  if (
    currentConversation.buyer_id !== profile.id &&
    currentConversation.seller_id !== profile.id
  ) {
    notFound();
  }

  const counterpartId =
    currentConversation.buyer_id === profile.id
      ? currentConversation.seller_id
      : currentConversation.buyer_id;

  const { data: counterpartProfile } = await supabase
    .from("profiles")
    .select("id, wallet_address")
    .eq("id", counterpartId)
    .maybeSingle();

  const headerData: ChatHeaderData = {
    avatarSeed: counterpartId,
    conversationId,
    displayName: shortenWallet(counterpartProfile?.wallet_address),
    initials: getInitials(shortenWallet(counterpartProfile?.wallet_address)),
  };

  const { data: rawMessages } = await supabase
    .from("messages")
    .select("id, sender_id, body, metadata, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(200);

  const messages: ChatMessageViewModel[] = ((rawMessages ?? []) as MessageRow[]).map(
    (message) => ({
      body: message.body,
      createdAt: message.created_at,
      id: message.id,
      metadata: message.metadata ?? {},
      senderId: message.sender_id,
      type: getMessageType(message.metadata),
    })
  );

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[393px] flex-col bg-white">
        <ChatHeader conversation={headerData} />
        <MessageList currentUserId={profile.id} messages={messages} />
        <MessageInputBar />
      </div>
    </main>
  );
}
