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

interface CreateDeliveryBody {
  metadata?: unknown;
  note?: unknown;
}

interface RouteContext {
  params: Promise<{
    dealId: string;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { dealId } = await context.params;
    const body = await readJsonBody<CreateDeliveryBody>(request);
    const { profile, supabase } = await requireAuthenticatedProfile();

    const { data: delivery, error } = await supabase
      .from("deal_deliveries")
      .insert({
        deal_id: parseUuid(dealId, "dealId"),
        metadata: parseJsonObject(body.metadata, "metadata"),
        note: parseNonEmptyText(body.note, "note", 4000),
        seller_id: profile.id,
      })
      .select("id, deal_id, seller_id, note, metadata, delivered_at, created_at, updated_at")
      .single();

    throwIfDatabaseError(
      error,
      "Unable to create the delivery record for this deal."
    );

    return NextResponse.json(
      {
        delivery,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    return jsonError(error);
  }
}
