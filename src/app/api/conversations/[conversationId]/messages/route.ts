import { NextResponse } from "next/server";
import {
  jsonError,
  parseJsonObject,
  parseNonEmptyText,
  parseUuid,
  readJsonBody,
  requireAuthenticatedProfile,
  throwIfDatabaseError,
} from "@/lib/safedeal/server";

interface CreateMessageBody {
  body?: unknown;
  metadata?: unknown;
}

interface RouteContext {
  params: Promise<{
    conversationId: string;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { conversationId } = await context.params;
    const body = await readJsonBody<CreateMessageBody>(request);
    const { profile, supabase } = await requireAuthenticatedProfile();

    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        body: parseNonEmptyText(body.body, "body", 4000),
        conversation_id: parseUuid(conversationId, "conversationId"),
        metadata: parseJsonObject(body.metadata, "metadata"),
        sender_id: profile.id,
      })
      .select("id, conversation_id, sender_id, body, metadata, created_at")
      .single();

    throwIfDatabaseError(error, "Unable to send the message.");

    return NextResponse.json(
      {
        message,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    return jsonError(error);
  }
}
