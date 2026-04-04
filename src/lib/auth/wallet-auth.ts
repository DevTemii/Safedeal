import type { User, UserIdentity } from "@supabase/supabase-js";
import { getAddress, isAddress, type Address } from "viem";

export const SAFEDEAL_AUTH_STATEMENT =
  "Sign in to SafeDeal with your MiniPay wallet.";

type IdentityRecord = UserIdentity & {
  provider_id?: unknown;
  identity_data?: Record<string, unknown> | null;
};

export function normalizeWalletAddress(value: unknown): Address | null {
  if (typeof value !== "string" || !isAddress(value)) {
    return null;
  }

  return getAddress(value);
}

function normalizePrefixedWalletAddress(value: unknown): Address | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.startsWith("web3:ethereum:")
    ? value.slice("web3:ethereum:".length)
    : value;

  return normalizeWalletAddress(normalizedValue);
}

function extractWalletAddressFromIdentity(identity: UserIdentity): Address | null {
  const rawIdentity = identity as IdentityRecord;
  const identityData =
    rawIdentity.identity_data && typeof rawIdentity.identity_data === "object"
      ? rawIdentity.identity_data
      : null;

  const customClaims =
    identityData?.custom_claims &&
    typeof identityData.custom_claims === "object"
      ? (identityData.custom_claims as Record<string, unknown>)
      : null;

  const orderedCandidates: Array<{
    stripPrefix: boolean;
    value: unknown;
  }> = [
    {
      stripPrefix: false,
      value: customClaims?.address,
    },
    {
      stripPrefix: false,
      value: identityData?.wallet_address,
    },
    {
      stripPrefix: false,
      value: identityData?.address,
    },
    {
      stripPrefix: false,
      value: identityData?.ethereum_address,
    },
    {
      stripPrefix: true,
      value: identity.id,
    },
    {
      stripPrefix: true,
      value: identityData?.sub,
    },
    {
      stripPrefix: false,
      value: rawIdentity.provider_id,
    },
  ];

  for (const candidate of orderedCandidates) {
    const walletAddress = candidate.stripPrefix
      ? normalizePrefixedWalletAddress(candidate.value)
      : normalizeWalletAddress(candidate.value);

    if (walletAddress) {
      return walletAddress;
    }
  }

  return null;
}

export function extractWalletAddressFromIdentities(
  identities: readonly UserIdentity[] | null | undefined
): Address | null {
  for (const identity of identities ?? []) {
    const walletAddress = extractWalletAddressFromIdentity(identity);

    if (walletAddress) {
      return walletAddress;
    }
  }

  return null;
}

export function extractWalletAddressFromUser(user: User): Address | null {
  return extractWalletAddressFromIdentities(user.identities ?? []);
}

export function summarizeUserIdentities(
  identities: readonly UserIdentity[] | null | undefined
) {
  return (identities ?? []).map((identity) => {
    const rawIdentity = identity as IdentityRecord;

    return {
      provider: identity.provider,
      id: identity.id,
      identity_id: identity.identity_id,
      provider_id:
        typeof rawIdentity.provider_id === "string" ? rawIdentity.provider_id : null,
      identity_data: rawIdentity.identity_data ?? null,
    };
  });
}
