import { normalizeWalletAddress } from "@/lib/auth/wallet-auth";
import {
  ApiError,
  requireAuthenticatedProfile,
} from "@/lib/safedeal/server";

export type DealActorRole = "buyer" | "seller";

export interface DealActionRecord {
  amount_minor: number;
  buyer_id: string;
  contract_deal_id: number | string | null;
  conversation_id: string;
  delivery_status: string;
  description: string | null;
  dispute_status: string;
  escrow_status: string;
  id: string;
  seller_id: string;
  settlement_token: string;
  status: string;
  title: string;
  tx_create_hash: string | null;
  tx_deliver_hash: string | null;
  tx_fund_hash: string | null;
  tx_release_hash: string | null;
}

export interface DealActionContext {
  actorRole: DealActorRole;
  actorWalletAddress: `0x${string}`;
  buyerWalletAddress: `0x${string}`;
  contractDealId: bigint | null;
  deal: DealActionRecord;
  profile: Awaited<ReturnType<typeof requireAuthenticatedProfile>>["profile"];
  sellerWalletAddress: `0x${string}`;
  supabase: Awaited<ReturnType<typeof requireAuthenticatedProfile>>["supabase"];
}

function coerceNullableContractDealId(value: number | string | null) {
  if (value === null || value === undefined) {
    return null;
  }

  return BigInt(value);
}

export async function loadDealActionContext(
  dealId: string
): Promise<DealActionContext> {
  const { profile, supabase } = await requireAuthenticatedProfile();

  const { data: deal, error: dealError } = await supabase
    .from("deals")
    .select(
      "id, conversation_id, buyer_id, seller_id, title, description, amount_minor, settlement_token, status, escrow_status, delivery_status, dispute_status, contract_deal_id, tx_create_hash, tx_fund_hash, tx_deliver_hash, tx_release_hash"
    )
    .eq("id", dealId)
    .maybeSingle();

  if (dealError) {
    throw dealError;
  }

  if (!deal) {
    throw new ApiError(404, "Deal not found.");
  }

  const typedDeal = deal as DealActionRecord;

  if (profile.id !== typedDeal.buyer_id && profile.id !== typedDeal.seller_id) {
    throw new ApiError(403, "You do not have access to this deal.");
  }

  const { data: participantProfiles, error: participantProfilesError } = await supabase
    .from("profiles")
    .select("id, wallet_address")
    .in("id", [typedDeal.buyer_id, typedDeal.seller_id]);

  if (participantProfilesError) {
    throw participantProfilesError;
  }

  const buyerProfile = participantProfiles?.find(
    (participantProfile) => participantProfile.id === typedDeal.buyer_id
  );
  const sellerProfile = participantProfiles?.find(
    (participantProfile) => participantProfile.id === typedDeal.seller_id
  );

  const actorWalletAddress = normalizeWalletAddress(profile.wallet_address);
  const buyerWalletAddress = normalizeWalletAddress(buyerProfile?.wallet_address);
  const sellerWalletAddress = normalizeWalletAddress(sellerProfile?.wallet_address);

  if (!actorWalletAddress || !buyerWalletAddress || !sellerWalletAddress) {
    throw new ApiError(500, "Deal participants must have valid wallet addresses.");
  }

  return {
    actorRole: profile.id === typedDeal.buyer_id ? "buyer" : "seller",
    actorWalletAddress,
    buyerWalletAddress,
    contractDealId: coerceNullableContractDealId(typedDeal.contract_deal_id),
    deal: typedDeal,
    profile,
    sellerWalletAddress,
    supabase,
  };
}

export function assertDealActorRole(
  actualRole: DealActorRole,
  expectedRole: DealActorRole
) {
  if (actualRole !== expectedRole) {
    throw new ApiError(
      403,
      expectedRole === "buyer"
        ? "Only the buyer can perform this action."
        : "Only the seller can perform this action."
    );
  }
}

export function assertDealStatus(
  actualStatus: string,
  expectedStatuses: readonly string[]
) {
  if (!expectedStatuses.includes(actualStatus)) {
    throw new ApiError(
      409,
      `Deal must be in one of these states: ${expectedStatuses.join(", ")}.`
    );
  }
}

export function assertNoRecordedTxHash(
  txHash: string | null,
  fieldLabel: string
) {
  if (txHash) {
    throw new ApiError(409, `${fieldLabel} has already been confirmed.`);
  }
}

export function requireContractDealId(contractDealId: bigint | null) {
  if (contractDealId === null) {
    throw new ApiError(
      409,
      "This deal is not ready for onchain actions yet. Initialize the escrow deal first."
    );
  }

  return contractDealId;
}
