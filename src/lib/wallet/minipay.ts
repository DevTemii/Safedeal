import {
  createWalletClient,
  custom,
  getAddress,
  isAddress,
  type Address,
} from "viem";
import { getSafeDealChain } from "@/lib/contracts/network";

export interface MiniPayProvider {
  isMiniPay?: boolean;
  selectedAddress?: string | null;
  request(args: {
    method: string;
    params?: readonly unknown[] | object;
  }): Promise<unknown>;
}

function parseAddress(value: unknown): Address | null {
  if (typeof value !== "string" || !isAddress(value)) {
    return null;
  }

  return getAddress(value);
}

export function getMiniPayProvider(): MiniPayProvider | null {
  if (typeof window === "undefined") {
    return null;
  }

  const provider = window.ethereum;
  if (!provider || provider.isMiniPay !== true) {
    return null;
  }

  return provider;
}

export function isMiniPayAvailable(): boolean {
  return getMiniPayProvider() !== null;
}

export function createMiniPayWalletClient() {
  const provider = getMiniPayProvider();

  if (!provider) {
    return null;
  }

  return createWalletClient({
    chain: getSafeDealChain(),
    transport: custom(provider),
  });
}

export async function getConnectedMiniPayAddress(): Promise<Address | null> {
  const provider = getMiniPayProvider();

  if (!provider) {
    return null;
  }

  const accounts = await provider.request({
    method: "eth_accounts",
  });

  if (!Array.isArray(accounts)) {
    return null;
  }

  return parseAddress(accounts[0]);
}

export async function requestMiniPayAccount(): Promise<Address> {
  const provider = getMiniPayProvider();

  if (!provider) {
    throw new Error(
      "MiniPay is not available. Open SafeDeal inside the MiniPay browser."
    );
  }

  const accounts = await provider.request({
    method: "eth_requestAccounts",
  });

  if (!Array.isArray(accounts)) {
    throw new Error("MiniPay returned an unexpected account response.");
  }

  const account = parseAddress(accounts[0]);

  if (!account) {
    throw new Error("MiniPay did not return a valid wallet address.");
  }

  return account;
}
