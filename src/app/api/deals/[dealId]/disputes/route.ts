import { NextResponse } from "next/server";
import {
  jsonError,
  parseNonEmptyText,
  parseOptionalText,
  parseUuid,
  readJsonBody,
  requireAuthenticatedProfile,
  throwIfDatabaseError,
} from "@/lib/safedeal/server";

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
    const { profile, supabase } = await requireAuthenticatedProfile();

    const { data: dispute, error } = await supabase
      .from("deal_disputes")
      .insert({
        deal_id: parseUuid(dealId, "dealId"),
        details: parseOptionalText(body.details, "details", 4000),
        raised_by: profile.id,
        reason: parseNonEmptyText(body.reason, "reason", 240),
      })
      .select("id, deal_id, raised_by, reason, details, status, created_at, updated_at")
      .single();

    throwIfDatabaseError(error, "Unable to raise a dispute for this deal.");

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
