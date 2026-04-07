import { NextResponse } from "next/server";
import { getAddress } from "viem";
import {
  getDealCreatedLog,
  getDealFundedLog,
  parseTransactionHash,
  waitForConfirmedEscrowTransaction,
} from "@/lib/contracts/escrow";
import { getUsdcAddress } from "@/lib/contracts/usdc";
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

interface ConfirmFundBody {
  stage?: unknown;
  txHash?: unknown;
}

interface RouteContext {
  params: Promise<{
    dealId: string;
  }>;
}

function parseStage(value: unknown) {
  if (value !== "create" && value !== "fund") {
    throw new ApiError(400, "stage must be either create or fund.");
  }

  return value;
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
    const body = await readJsonBody<ConfirmFundBody>(request);
    const actionContext = await loadDealActionContext(parseUuid(dealId, "dealId"));
    const stage = parseStage(body.stage);
    const txHash = parseTxHash(body.txHash);

    assertDealActorRole(actionContext.actorRole, "buyer");

    if (stage === "create") {
      assertDealStatus(actionContext.deal.status, [
        "draft",
        "approved",
        "funding_pending",
      ]);
      assertNoRecordedTxHash(actionContext.deal.tx_create_hash, "create funding");

      const { blockTimestampIso, receipt, transaction } =
        await waitForConfirmedEscrowTransaction(txHash);

      if (receipt.status !== "success") {
        throw new ApiError(422, "The create transaction did not succeed.");
      }

      if (getAddress(transaction.from) !== actionContext.actorWalletAddress) {
        throw new ApiError(403, "The create transaction wallet does not match the authenticated user.");
      }

      const createdLog = getDealCreatedLog(receipt);

      const createdArgs = createdLog?.args;

      if (
        !createdArgs ||
        !createdArgs.buyer ||
        !createdArgs.seller ||
        !createdArgs.token ||
        createdArgs.amount === undefined ||
        createdArgs.dealId === undefined
      ) {
        throw new ApiError(422, "Unable to verify the deal creation event.");
      }

      if (
        getAddress(createdArgs.buyer) !== actionContext.buyerWalletAddress ||
        getAddress(createdArgs.seller) !== actionContext.sellerWalletAddress
      ) {
        throw new ApiError(422, "The onchain deal participants do not match this SafeDeal record.");
      }

      if (getAddress(createdArgs.token) !== getUsdcAddress()) {
        throw new ApiError(422, "The onchain deal token does not match the configured settlement token.");
      }

      if (createdArgs.amount !== BigInt(actionContext.deal.amount_minor)) {
        throw new ApiError(422, "The onchain deal amount does not match this SafeDeal record.");
      }

      const { data: updatedDeal, error: updatedDealError } = await actionContext.supabase
        .from("deals")
        .update({
          contract_deal_id: Number(createdArgs.dealId),
          escrow_status: "funding_pending",
          status: "funding_pending",
          tx_create_hash: txHash,
        })
        .eq("id", actionContext.deal.id)
        .is("tx_create_hash", null)
        .select(
          "id, contract_deal_id, status, escrow_status, tx_create_hash, updated_at"
        )
        .single();

      if (updatedDealError || !updatedDeal) {
        throw updatedDealError ?? new ApiError(409, "Deal creation has already been confirmed.");
      }

      return NextResponse.json({
        confirmedAt: blockTimestampIso,
        deal: updatedDeal,
        stage,
      });
    }

    assertDealStatus(actionContext.deal.status, [
      "draft",
      "approved",
      "funding_pending",
    ]);
    assertNoRecordedTxHash(actionContext.deal.tx_fund_hash, "funding");

    const contractDealId = requireContractDealId(actionContext.contractDealId);
    const { blockTimestampIso, receipt, transaction } =
      await waitForConfirmedEscrowTransaction(txHash);

    if (receipt.status !== "success") {
      throw new ApiError(422, "The funding transaction did not succeed.");
    }

    if (getAddress(transaction.from) !== actionContext.actorWalletAddress) {
      throw new ApiError(403, "The funding transaction wallet does not match the authenticated user.");
    }

    const fundedLog = getDealFundedLog(receipt);

    const fundedArgs = fundedLog?.args;

    if (
      !fundedArgs ||
      fundedArgs.dealId === undefined ||
      !fundedArgs.buyer ||
      fundedArgs.amount === undefined
    ) {
      throw new ApiError(422, "Unable to verify the funding event.");
    }

    if (fundedArgs.dealId !== contractDealId) {
      throw new ApiError(422, "The funding event does not belong to this deal.");
    }

    if (getAddress(fundedArgs.buyer) !== actionContext.buyerWalletAddress) {
      throw new ApiError(422, "The onchain buyer does not match this SafeDeal record.");
    }

    if (fundedArgs.amount !== BigInt(actionContext.deal.amount_minor)) {
      throw new ApiError(422, "The funded amount does not match this SafeDeal record.");
    }

    const { data: updatedDeal, error: updatedDealError } = await actionContext.supabase
      .from("deals")
      .update({
        escrow_status: "funded",
        status: "funded",
        tx_fund_hash: txHash,
      })
      .eq("id", actionContext.deal.id)
      .is("tx_fund_hash", null)
      .select(
        "id, contract_deal_id, status, escrow_status, tx_fund_hash, updated_at"
      )
      .single();

    if (updatedDealError || !updatedDeal) {
      throw updatedDealError ?? new ApiError(409, "Deal funding has already been confirmed.");
    }

    return NextResponse.json({
      confirmedAt: blockTimestampIso,
      deal: updatedDeal,
      stage,
    });
  } catch (error) {
    return jsonError(error);
  }
}
