import { NextResponse } from "next/server";
import { encodeReleaseDealTransaction } from "@/lib/contracts/escrow";
import { ApiError, jsonError, parseUuid } from "@/lib/safedeal/server";
import {
  assertDealActorRole,
  assertDealStatus,
  loadDealActionContext,
  requireContractDealId,
} from "@/lib/validators/deal-actions";

interface RouteContext {
  params: Promise<{
    dealId: string;
  }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { dealId } = await context.params;
    const actionContext = await loadDealActionContext(parseUuid(dealId, "dealId"));

    assertDealActorRole(actionContext.actorRole, "buyer");
    assertDealStatus(actionContext.deal.status, ["delivered"]);

    if (
      actionContext.deal.dispute_status === "open" ||
      actionContext.deal.status === "disputed"
    ) {
      throw new ApiError(409, "Disputed deals cannot release funds.");
    }

    const contractDealId = requireContractDealId(actionContext.contractDealId);

    return NextResponse.json({
      deal: {
        contractDealId: contractDealId.toString(),
        id: actionContext.deal.id,
        status: actionContext.deal.status,
        title: actionContext.deal.title,
      },
      transaction: encodeReleaseDealTransaction(contractDealId),
    });
  } catch (error) {
    return jsonError(error);
  }
}
