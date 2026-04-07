import { NextResponse } from "next/server";
import {
  createPreparedTransaction,
  encodeCreateDealTransaction,
  encodeFundDealTransaction,
  getEscrowAddress,
} from "@/lib/contracts/escrow";
import { encodeApproveUsdcTransaction, getUsdcAllowance, getUsdcAddress } from "@/lib/contracts/usdc";
import { ApiError, jsonError, parseUuid } from "@/lib/safedeal/server";
import {
  assertDealActorRole,
  assertDealStatus,
  loadDealActionContext,
} from "@/lib/validators/deal-actions";

interface RouteContext {
  params: Promise<{
    dealId: string;
  }>;
}

function parseDeadlineAtToUnix(deadlineAt: string) {
  const timestamp = Date.parse(deadlineAt);

  if (Number.isNaN(timestamp)) {
    throw new ApiError(500, "Deal deadline is invalid.");
  }

  return BigInt(Math.floor(timestamp / 1000));
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { dealId } = await context.params;
    const actionContext = await loadDealActionContext(parseUuid(dealId, "dealId"));

    assertDealActorRole(actionContext.actorRole, "buyer");
    assertDealStatus(actionContext.deal.status, [
      "draft",
      "approved",
      "funding_pending",
    ]);

    if (actionContext.deal.dispute_status === "open") {
      throw new ApiError(409, "Disputed deals cannot be funded.");
    }

    if (actionContext.contractDealId === null) {
      return NextResponse.json({
        deal: {
          amountMinor: actionContext.deal.amount_minor,
          deadlineAt: actionContext.deal.deadline_at,
          id: actionContext.deal.id,
          status: actionContext.deal.status,
          title: actionContext.deal.title,
        },
        step: "create",
        transaction: encodeCreateDealTransaction({
          amount: BigInt(actionContext.deal.amount_minor),
          deadline: parseDeadlineAtToUnix(actionContext.deal.deadline_at),
          seller: actionContext.sellerWalletAddress,
          token: getUsdcAddress(),
        }),
      });
    }

    const allowance = await getUsdcAllowance({
      owner: actionContext.actorWalletAddress,
      spender: getEscrowAddress(),
    });
    const amount = BigInt(actionContext.deal.amount_minor);

    return NextResponse.json({
      approvalRequired: allowance < amount,
      approveTransaction:
        allowance < amount
          ? createPreparedTransaction(
              encodeApproveUsdcTransaction({
                amount,
                spender: getEscrowAddress(),
              }),
              getUsdcAddress()
            )
          : null,
      deal: {
        amountMinor: actionContext.deal.amount_minor,
        contractDealId: actionContext.contractDealId.toString(),
        deadlineAt: actionContext.deal.deadline_at,
        id: actionContext.deal.id,
        status: actionContext.deal.status,
        title: actionContext.deal.title,
      },
      step: "fund",
      transaction: encodeFundDealTransaction(actionContext.contractDealId),
    });
  } catch (error) {
    return jsonError(error);
  }
}
