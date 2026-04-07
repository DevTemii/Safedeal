import { NextResponse } from "next/server";
import { encodeMarkDeliveredTransaction } from "@/lib/contracts/escrow";
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

    assertDealActorRole(actionContext.actorRole, "seller");
    assertDealStatus(actionContext.deal.status, ["funded"]);

    if (actionContext.deal.dispute_status === "open") {
      throw new ApiError(409, "Disputed deals cannot be marked as delivered.");
    }

    const contractDealId = requireContractDealId(actionContext.contractDealId);

    return NextResponse.json({
      deal: {
        contractDealId: contractDealId.toString(),
        id: actionContext.deal.id,
        status: actionContext.deal.status,
        title: actionContext.deal.title,
      },
      transaction: encodeMarkDeliveredTransaction(contractDealId),
    });
  } catch (error) {
    return jsonError(error);
  }
}
