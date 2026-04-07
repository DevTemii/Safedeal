import { NextResponse } from "next/server";
import { getAddress } from "viem";
import {
  getDealReleasedLog,
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

interface ConfirmReleaseBody {
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
    const body = await readJsonBody<ConfirmReleaseBody>(request);
    const actionContext = await loadDealActionContext(parseUuid(dealId, "dealId"));
    const txHash = parseTxHash(body.txHash);

    assertDealActorRole(actionContext.actorRole, "buyer");
    assertDealStatus(actionContext.deal.status, ["delivered"]);
    assertNoRecordedTxHash(actionContext.deal.tx_release_hash, "release");

    if (
      actionContext.deal.dispute_status === "open" ||
      actionContext.deal.status === "disputed"
    ) {
      throw new ApiError(409, "Disputed deals cannot release funds.");
    }

    const contractDealId = requireContractDealId(actionContext.contractDealId);
    const { blockTimestampIso, receipt, transaction } =
      await waitForConfirmedEscrowTransaction(txHash);

    if (receipt.status !== "success") {
      throw new ApiError(422, "The release transaction did not succeed.");
    }

    if (getAddress(transaction.from) !== actionContext.actorWalletAddress) {
      throw new ApiError(403, "The release transaction wallet does not match the authenticated user.");
    }

    const releasedLog = getDealReleasedLog(receipt);
    const releasedArgs = releasedLog?.args;

    if (
      !releasedArgs ||
      releasedArgs.dealId === undefined ||
      !releasedArgs.buyer ||
      !releasedArgs.seller ||
      releasedArgs.amount === undefined
    ) {
      throw new ApiError(422, "Unable to verify the release event.");
    }

    if (releasedArgs.dealId !== contractDealId) {
      throw new ApiError(422, "The release event does not belong to this deal.");
    }

    if (getAddress(releasedArgs.buyer) !== actionContext.buyerWalletAddress) {
      throw new ApiError(422, "The onchain buyer does not match this SafeDeal record.");
    }

    if (getAddress(releasedArgs.seller) !== actionContext.sellerWalletAddress) {
      throw new ApiError(422, "The onchain seller does not match this SafeDeal record.");
    }

    if (releasedArgs.amount !== BigInt(actionContext.deal.amount_minor)) {
      throw new ApiError(422, "The released amount does not match this SafeDeal record.");
    }

    const { data: updatedDeal, error: updatedDealError } = await actionContext.supabase
      .from("deals")
      .update({
        escrow_status: "released",
        status: "completed",
        tx_release_hash: txHash,
      })
      .eq("id", actionContext.deal.id)
      .is("tx_release_hash", null)
      .select(
        "id, contract_deal_id, status, escrow_status, tx_release_hash, updated_at"
      )
      .single();

    if (updatedDealError || !updatedDeal) {
      throw updatedDealError ?? new ApiError(409, "Deal release has already been confirmed.");
    }

    return NextResponse.json({
      confirmedAt: blockTimestampIso,
      deal: updatedDeal,
    });
  } catch (error) {
    return jsonError(error);
  }
}
