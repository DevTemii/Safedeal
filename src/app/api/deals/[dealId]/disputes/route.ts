import { NextResponse } from "next/server";
import { buildDealCardMetadata } from "@/lib/chat/deal-messages";
import {
  ApiError,
  jsonError,
  parseNonEmptyText,
  parseOptionalText,
  parseUuid,
  readJsonBody,
  throwIfDatabaseError,
} from "@/lib/safedeal/server";
import { loadDealActionContext } from "@/lib/validators/deal-actions";

interface CreateDisputeBody {
  details?: unknown;
  reason?: unknown;
}

interface RouteContext {
  params: Promise<{
    dealId: string;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { dealId } = await context.params;
    const body = await readJsonBody<CreateDisputeBody>(request);
    const actionContext = await loadDealActionContext(parseUuid(dealId, "dealId"));

    if (
      actionContext.deal.status === "completed" ||
      actionContext.deal.status === "disputed" ||
      actionContext.deal.dispute_status === "open"
    ) {
      throw new ApiError(409, "This deal can no longer be disputed.");
    }

    const { data: dispute, error } = await actionContext.supabase
      .from("deal_disputes")
      .insert({
        deal_id: actionContext.deal.id,
        details: parseOptionalText(body.details, "details", 4000),
        raised_by: actionContext.profile.id,
        reason: parseNonEmptyText(body.reason, "reason", 240),
      })
      .select("id, deal_id, raised_by, reason, details, status, created_at, updated_at")
      .single();

    throwIfDatabaseError(error, "Unable to raise a dispute for this deal.");

    const { error: dealUpdateError } = await actionContext.supabase
      .from("deals")
      .update({
        dispute_status: "open",
        status: "disputed",
      })
      .eq("id", actionContext.deal.id)
      .neq("status", "completed");

    if (dealUpdateError) {
      throw dealUpdateError;
    }

    const { error: messageInsertError } = await actionContext.supabase
      .from("messages")
      .insert([
        {
          body: "A dispute has been raised. Release is now blocked.",
          conversation_id: actionContext.deal.conversation_id,
          metadata: {
            type: "system",
          },
          sender_id: actionContext.profile.id,
        },
        {
          body: "Deal disputed",
          conversation_id: actionContext.deal.conversation_id,
          metadata: buildDealCardMetadata({
            amountMinor: actionContext.deal.amount_minor,
            buyerId: actionContext.deal.buyer_id,
            dealId: actionContext.deal.id,
            deliveryLabel: actionContext.deal.description,
            sellerId: actionContext.deal.seller_id,
            status: "disputed",
            title: actionContext.deal.title,
          }),
          sender_id: actionContext.profile.id,
        },
      ]);

    if (messageInsertError) {
      console.error("[deal.disputes] unable to append chat messages:", messageInsertError);
    }

    return NextResponse.json(
      {
        dispute,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    return jsonError(error);
  }
}
