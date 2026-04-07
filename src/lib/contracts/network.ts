import { defineChain, type Chain } from "viem";

const DEFAULT_CELO_CHAIN_ID = 42220;
const DEFAULT_CELO_RPC_URL = "https://forno.celo.org";
const DEFAULT_CELO_SEPOLIA_CHAIN_ID = 44787;
const DEFAULT_CELO_SEPOLIA_RPC_URL = "https://sepolia-forno.celo-testnet.org";

function getConfiguredChainId() {
  const rawValue =
    process.env.NEXT_PUBLIC_NETWORK_ID ?? process.env.NETWORK_ID ?? null;

  if (!rawValue) {
    // Stay on Sepolia by default until SafeDeal explicitly moves to mainnet.
    return DEFAULT_CELO_SEPOLIA_CHAIN_ID;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error("Invalid NEXT_PUBLIC_NETWORK_ID.");
  }

  return parsedValue;
}

function getDefaultRpcUrl(chainId: number) {
  return chainId === DEFAULT_CELO_SEPOLIA_CHAIN_ID
    ? DEFAULT_CELO_SEPOLIA_RPC_URL
    : DEFAULT_CELO_RPC_URL;
}

export function getSafeDealChain(): Chain {
  const chainId = getConfiguredChainId();
  const rpcUrl =
    process.env.NEXT_PUBLIC_RPC_URL ??
    process.env.RPC_URL ??
    getDefaultRpcUrl(chainId);

  return defineChain({
    id: chainId,
    name:
      chainId === DEFAULT_CELO_SEPOLIA_CHAIN_ID
        ? "Celo Sepolia"
        : "Celo Mainnet",
    nativeCurrency: {
      decimals: 18,
      name: "Celo",
      symbol: "CELO",
    },
    rpcUrls: {
      default: {
        http: [rpcUrl],
      },
      public: {
        http: [rpcUrl],
      },
    },
  });
}

export function getSafeDealChainId() {
  return getSafeDealChain().id;
}

export function getSafeDealRpcUrl() {
  return getSafeDealChain().rpcUrls.default.http[0];
}
