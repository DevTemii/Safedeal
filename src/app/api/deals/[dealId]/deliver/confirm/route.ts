import { NextResponse } from "next/server";
import { getAddress } from "viem";
import {
  getDealDeliveredLog,
  parseTransactionHash,
  waitForConfirmedEscrowTransaction,
} from "@/lib/contracts/escrow";
import {
  ApiError,
  jsonError,
  parseUuid,
  readJsonBody,
} from "@/lib/safedeal/server";
import {
  assertDealActorRole,
  assertDealStatus,
  assertNoRecordedTxHash,
  loadDealActionContext,
  requireContractDealId,
} from "@/lib/validators/deal-actions";

interface ConfirmDeliverBody {
  txHash?: unknown;
}

interface RouteContext {
  params: Promise<{
    dealId: string;
  }>;
}

function parseTxHash(value: unknown) {
  try {
    return parseTransactionHash(value, "txHash");
  } catch {
    throw new ApiError(400, "txHash must be a valid transaction hash.");
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { dealId } = await context.params;
    const body = await readJsonBody<ConfirmDeliverBody>(request);
    const actionContext = await loadDealActionContext(parseUuid(dealId, "dealId"));
    const txHash = parseTxHash(body.txHash);

    assertDealActorRole(actionContext.actorRole, "seller");
    assertDealStatus(actionContext.deal.status, ["funded"]);
    assertNoRecordedTxHash(actionContext.deal.tx_deliver_hash, "delivery");

    const contractDealId = requireContractDealId(actionContext.contractDealId);
    const { blockTimestampIso, receipt, transaction } =
      await waitForConfirmedEscrowTransaction(txHash);

    if (receipt.status !== "success") {
      throw new ApiError(422, "The delivery transaction did not succeed.");
    }

    if (getAddress(transaction.from) !== actionContext.actorWalletAddress) {
      throw new ApiError(403, "The delivery transaction wallet does not match the authenticated user.");
    }

    const deliveredLog = getDealDeliveredLog(receipt);
    const deliveredArgs = deliveredLog?.args;

    if (
      !deliveredArgs ||
      deliveredArgs.dealId === undefined ||
      !deliveredArgs.seller
    ) {
      throw new ApiError(422, "Unable to verify the delivery event.");
    }

    if (deliveredArgs.dealId !== contractDealId) {
      throw new ApiError(422, "The delivery event does not belong to this deal.");
    }

    if (getAddress(deliveredArgs.seller) !== actionContext.sellerWalletAddress) {
      throw new ApiError(422, "The onchain seller does not match this SafeDeal record.");
    }

    const { data: updatedDeal, error: updatedDealError } = await actionContext.supabase
      .from("deals")
      .update({
        delivery_status: "confirmed",
        status: "delivered",
        tx_deliver_hash: txHash,
      })
      .eq("id", actionContext.deal.id)
      .is("tx_deliver_hash", null)
      .select(
        "id, contract_deal_id, status, delivery_status, tx_deliver_hash, updated_at"
      )
      .single();

    if (updatedDealError || !updatedDeal) {
      throw updatedDealError ?? new ApiError(409, "Deal delivery has already been confirmed.");
    }

    return NextResponse.json({
      confirmedAt: blockTimestampIso,
      deal: updatedDeal,
    });
  } catch (error) {
    return jsonError(error);
  }
}
