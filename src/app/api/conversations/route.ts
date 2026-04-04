import { NextResponse } from "next/server";
import {
  ApiError,
  jsonError,
  parseUuid,
  readJsonBody,
  requireAuthenticatedProfile,
  throwIfDatabaseError,
} from "@/lib/safedeal/server";

interface CreateConversationBody {
  buyerId?: unknown;
  sellerId?: unknown;
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<CreateConversationBody>(request);
    const buyerId = parseUuid(body.buyerId, "buyerId");
    const sellerId = parseUuid(body.sellerId, "sellerId");
    const { profile, supabase } = await requireAuthenticatedProfile();

    if (buyerId === sellerId) {
      throw new ApiError(400, "buyerId and sellerId must be different users.");
    }

    if (profile.id !== buyerId && profile.id !== sellerId) {
      throw new ApiError(
        403,
        "Only the buyer or seller can create this conversation."
      );
    }

    const { data: existingConversation, error: existingConversationError } =
      await supabase
        .from("conversations")
        .select("id, buyer_id, seller_id, last_message_at, created_at, updated_at")
        .eq("buyer_id", buyerId)
        .eq("seller_id", sellerId)
        .maybeSingle();

    throwIfDatabaseError(
      existingConversationError,
      "Unable to load the conversation."
    );

    if (existingConversation) {
      return NextResponse.json(
        {
          conversation: existingConversation,
        },
        {
          status: 200,
        }
      );
    }

    const { data: conversation, error } = await supabase
      .from("conversations")
      .insert({
        buyer_id: buyerId,
        seller_id: sellerId,
      })
      .select("id, buyer_id, seller_id, last_message_at, created_at, updated_at")
      .single();

    throwIfDatabaseError(error, "Unable to create the conversation.");

    return NextResponse.json(
      {
        conversation,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    return jsonError(error);
  }
}
