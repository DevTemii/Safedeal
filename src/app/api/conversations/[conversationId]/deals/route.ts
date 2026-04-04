import { NextResponse } from "next/server";
import {
  jsonError,
  parseNonEmptyText,
  parseOptionalText,
  parsePositiveInteger,
  parseUuid,
  readJsonBody,
  requireAuthenticatedProfile,
  throwIfDatabaseError,
} from "@/lib/safedeal/server";

interface CreateDealBody {
  amountMinor?: unknown;
  description?: unknown;
  title?: unknown;
}

interface RouteContext {
  params: Promise<{
    conversationId: string;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { conversationId } = await context.params;
    const body = await readJsonBody<CreateDealBody>(request);
    const { profile, supabase } = await requireAuthenticatedProfile();

    const { data: deal, error } = await supabase
      .from("deals")
      .insert({
        amount_minor: parsePositiveInteger(body.amountMinor, "amountMinor"),
        conversation_id: parseUuid(conversationId, "conversationId"),
        created_by: profile.id,
        description: parseOptionalText(body.description, "description", 4000),
        title: parseNonEmptyText(body.title, "title", 160),
      })
      .select(
        "id, conversation_id, buyer_id, seller_id, created_by, title, description, amount_minor, settlement_token, status, escrow_status, delivery_status, dispute_status, created_at, updated_at"
      )
      .single();

    throwIfDatabaseError(error, "Unable to create the deal.");

    return NextResponse.json(
      {
        deal,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    return jsonError(error);
  }
}
