import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/contracts/usdc", () => ({
  getUsdcAddress: vi.fn(),
}));

vi.mock("@/lib/contracts/escrow", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/contracts/escrow")>(
      "@/lib/contracts/escrow"
    );

  return {
    ...actual,
    getDealCreatedLog: vi.fn(),
    getDealDeliveredLog: vi.fn(),
    getDealFundedLog: vi.fn(),
    getDealReleasedLog: vi.fn(),
    waitForConfirmedEscrowTransaction: vi.fn(),
  };
});

vi.mock("@/lib/validators/deal-actions", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/validators/deal-actions")>(
      "@/lib/validators/deal-actions"
    );

  return {
    ...actual,
    loadDealActionContext: vi.fn(),
  };
});

import { POST as postDeliverConfirm } from "@/app/api/deals/[dealId]/deliver/confirm/route";
import { POST as postFundConfirm } from "@/app/api/deals/[dealId]/fund/confirm/route";
import { POST as postReleaseConfirm } from "@/app/api/deals/[dealId]/release/confirm/route";
import {
  getDealDeliveredLog,
  getDealFundedLog,
  getDealReleasedLog,
  waitForConfirmedEscrowTransaction,
} from "@/lib/contracts/escrow";
import { getUsdcAddress } from "@/lib/contracts/usdc";
import { loadDealActionContext } from "@/lib/validators/deal-actions";

const DEAL_ID = "11111111-1111-4111-8111-111111111111";
const CONVERSATION_ID = "22222222-2222-4222-8222-222222222222";
const BUYER_WALLET = "0x1111111111111111111111111111111111111111";
const SELLER_WALLET = "0x2222222222222222222222222222222222222222";
const USDC_ADDRESS = "0x3333333333333333333333333333333333333333";
const CONTRACT_DEAL_ID = 7n;
const TX_HASH = `0x${"a".repeat(64)}`;

function createRouteContext() {
  return {
    params: Promise.resolve({
      dealId: DEAL_ID,
    }),
  };
}

function createJsonRequest(body: Record<string, unknown>) {
  return new Request(`https://safedeal.test/api/deals/${DEAL_ID}/confirm`, {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

function createSupabaseMock({
  messageInsertError = null,
  updateData = {
    id: DEAL_ID,
    status: "updated",
    updated_at: "2026-04-07T00:00:00.000Z",
  },
  updateError = null,
}: {
  messageInsertError?: { message: string } | null;
  updateData?: Record<string, unknown> | null;
  updateError?: { message: string } | null;
} = {}) {
  const calls = {
    dealUpdates: [] as Array<Record<string, unknown>>,
    messageInserts: [] as Array<unknown>,
  };

  const dealUpdateQuery = {
    eq: vi.fn(() => dealUpdateQuery),
    is: vi.fn(() => dealUpdateQuery),
    select: vi.fn(() => dealUpdateQuery),
    single: vi.fn(async () => ({
      data: updateData,
      error: updateError,
    })),
  };

  const dealsTable = {
    update: vi.fn((payload: Record<string, unknown>) => {
      calls.dealUpdates.push(payload);
      return dealUpdateQuery;
    }),
  };

  const messagesTable = {
    insert: vi.fn(async (payload: unknown) => {
      calls.messageInserts.push(payload);

      return {
        error: messageInsertError,
      };
    }),
  };

  return {
    calls,
    supabase: {
      from: vi.fn((table: string) => {
        if (table === "deals") {
          return dealsTable;
        }

        if (table === "messages") {
          return messagesTable;
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    },
  };
}

function createActionContext({
  actorRole = "buyer",
  actorWalletAddress = BUYER_WALLET,
  contractDealId = CONTRACT_DEAL_ID,
  deal = {},
}: {
  actorRole?: "buyer" | "seller";
  actorWalletAddress?: string;
  contractDealId?: bigint | null;
  deal?: Record<string, unknown>;
} = {}) {
  const supabaseMock = createSupabaseMock();

  return {
    ...supabaseMock,
    actionContext: {
      actorRole,
      actorWalletAddress,
      buyerWalletAddress: BUYER_WALLET,
      contractDealId,
      deal: {
        amount_minor: 18000000,
        buyer_id: "buyer-profile",
        contract_deal_id:
          contractDealId === null ? null : Number(contractDealId),
        conversation_id: CONVERSATION_ID,
        deadline_at: "2026-04-10T09:00:00.000Z",
        delivery_status: "pending",
        description: "Tomorrow morning",
        dispute_status: "none",
        escrow_status: "funding_pending",
        id: DEAL_ID,
        seller_id: "seller-profile",
        settlement_token: "USDC",
        status: "funding_pending",
        title: "Birthday Cake",
        tx_create_hash: null,
        tx_deliver_hash: null,
        tx_fund_hash: null,
        tx_release_hash: null,
        ...deal,
      },
      profile: {
        id: actorRole === "buyer" ? "buyer-profile" : "seller-profile",
        wallet_address: actorWalletAddress,
      },
      sellerWalletAddress: SELLER_WALLET,
      supabase: supabaseMock.supabase,
    },
  };
}

function createConfirmedTransaction({
  from,
  status = "success",
}: {
  from: string;
  status?: "success" | "reverted";
}) {
  return {
    blockTimestampIso: "2026-04-07T00:00:00.000Z",
    receipt: {
      logs: [],
      status,
    },
    transaction: {
      from,
    },
  };
}

describe("deal confirmation routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUsdcAddress).mockReturnValue(USDC_ADDRESS);
  });

  it("rejects repeated fund confirmation attempts cleanly", async () => {
    const { actionContext, calls } = createActionContext({
      deal: {
        tx_fund_hash: TX_HASH,
      },
    });

    vi.mocked(loadDealActionContext).mockResolvedValue(actionContext as never);

    const response = await postFundConfirm(
      createJsonRequest({
        stage: "fund",
        txHash: TX_HASH,
      }),
      createRouteContext()
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "funding has already been confirmed.",
    });
    expect(calls.dealUpdates).toHaveLength(0);
    expect(calls.messageInserts).toHaveLength(0);
  });

  it("rejects fund confirmation when the tx wallet does not match the buyer", async () => {
    const { actionContext, calls } = createActionContext();

    vi.mocked(loadDealActionContext).mockResolvedValue(actionContext as never);
    vi.mocked(waitForConfirmedEscrowTransaction).mockResolvedValue(
      createConfirmedTransaction({
        from: SELLER_WALLET,
      }) as never
    );

    const response = await postFundConfirm(
      createJsonRequest({
        stage: "fund",
        txHash: TX_HASH,
      }),
      createRouteContext()
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "The funding transaction wallet does not match the authenticated user.",
    });
    expect(calls.dealUpdates).toHaveLength(0);
    expect(calls.messageInserts).toHaveLength(0);
  });

  it("does not mutate funded state when funding confirmation is unavailable", async () => {
    const { actionContext, calls } = createActionContext();

    vi.mocked(loadDealActionContext).mockResolvedValue(actionContext as never);
    vi.mocked(waitForConfirmedEscrowTransaction).mockRejectedValue(
      new Error("Receipt not available yet.")
    );

    const response = await postFundConfirm(
      createJsonRequest({
        stage: "fund",
        txHash: TX_HASH,
      }),
      createRouteContext()
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Internal server error.",
    });
    expect(calls.dealUpdates).toHaveLength(0);
    expect(calls.messageInserts).toHaveLength(0);
  });

  it("rejects delivery confirmation for non-seller actors", async () => {
    const { actionContext, calls } = createActionContext({
      actorRole: "buyer",
      deal: {
        status: "funded",
      },
    });

    vi.mocked(loadDealActionContext).mockResolvedValue(actionContext as never);

    const response = await postDeliverConfirm(
      createJsonRequest({
        txHash: TX_HASH,
      }),
      createRouteContext()
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Only the seller can perform this action.",
    });
    expect(calls.dealUpdates).toHaveLength(0);
  });

  it("rejects delivery confirmation before the deal is funded", async () => {
    const { actionContext, calls } = createActionContext({
      actorRole: "seller",
      actorWalletAddress: SELLER_WALLET,
      deal: {
        status: "approved",
      },
    });

    vi.mocked(loadDealActionContext).mockResolvedValue(actionContext as never);

    const response = await postDeliverConfirm(
      createJsonRequest({
        txHash: TX_HASH,
      }),
      createRouteContext()
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Deal must be in one of these states: funded.",
    });
    expect(calls.dealUpdates).toHaveLength(0);
  });

  it("does not mutate delivered state when the delivery transaction fails", async () => {
    const { actionContext, calls } = createActionContext({
      actorRole: "seller",
      actorWalletAddress: SELLER_WALLET,
      deal: {
        status: "funded",
      },
    });

    vi.mocked(loadDealActionContext).mockResolvedValue(actionContext as never);
    vi.mocked(waitForConfirmedEscrowTransaction).mockResolvedValue(
      createConfirmedTransaction({
        from: SELLER_WALLET,
        status: "reverted",
      }) as never
    );

    const response = await postDeliverConfirm(
      createJsonRequest({
        txHash: TX_HASH,
      }),
      createRouteContext()
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: "The delivery transaction did not succeed.",
    });
    expect(calls.dealUpdates).toHaveLength(0);
    expect(calls.messageInserts).toHaveLength(0);
  });

  it("blocks release confirmation when the deal is disputed", async () => {
    const { actionContext, calls } = createActionContext({
      deal: {
        dispute_status: "open",
        status: "delivered",
      },
    });

    vi.mocked(loadDealActionContext).mockResolvedValue(actionContext as never);

    const response = await postReleaseConfirm(
      createJsonRequest({
        txHash: TX_HASH,
      }),
      createRouteContext()
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Disputed deals cannot release funds.",
    });
    expect(calls.dealUpdates).toHaveLength(0);
  });

  it("does not mutate completed state when the release transaction fails", async () => {
    const { actionContext, calls } = createActionContext({
      deal: {
        status: "delivered",
      },
    });

    vi.mocked(loadDealActionContext).mockResolvedValue(actionContext as never);
    vi.mocked(waitForConfirmedEscrowTransaction).mockResolvedValue(
      createConfirmedTransaction({
        from: BUYER_WALLET,
        status: "reverted",
      }) as never
    );

    const response = await postReleaseConfirm(
      createJsonRequest({
        txHash: TX_HASH,
      }),
      createRouteContext()
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: "The release transaction did not succeed.",
    });
    expect(calls.dealUpdates).toHaveLength(0);
    expect(calls.messageInserts).toHaveLength(0);
  });

  it("rejects release confirmation when the tx wallet does not match the buyer", async () => {
    const { actionContext, calls } = createActionContext({
      deal: {
        status: "delivered",
      },
    });

    vi.mocked(loadDealActionContext).mockResolvedValue(actionContext as never);
    vi.mocked(waitForConfirmedEscrowTransaction).mockResolvedValue(
      createConfirmedTransaction({
        from: SELLER_WALLET,
      }) as never
    );

    vi.mocked(getDealReleasedLog).mockReturnValue(undefined);
    vi.mocked(getDealFundedLog).mockReturnValue(undefined);
    vi.mocked(getDealDeliveredLog).mockReturnValue(undefined);

    const response = await postReleaseConfirm(
      createJsonRequest({
        txHash: TX_HASH,
      }),
      createRouteContext()
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "The release transaction wallet does not match the authenticated user.",
    });
    expect(calls.dealUpdates).toHaveLength(0);
    expect(calls.messageInserts).toHaveLength(0);
  });
});
