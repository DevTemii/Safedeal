"use client";

import { hexToBigInt, type Hex } from "viem";
import {
  getEscrowPublicClient,
  type PreparedTransactionRequest,
} from "@/lib/contracts/escrow";
import { getSafeDealChain } from "@/lib/contracts/network";
import {
  createMiniPayWalletClient,
  requestMiniPayAccount,
} from "@/lib/wallet/minipay";

export async function sendPreparedTransaction(
  request: PreparedTransactionRequest
) {
  const walletClient = createMiniPayWalletClient();

  if (!walletClient) {
    throw new Error(
      "MiniPay is not available. Open SafeDeal inside the MiniPay browser."
    );
  }

  const account = await requestMiniPayAccount();

  return walletClient.sendTransaction({
    account,
    chain: getSafeDealChain(),
    data: request.data,
    to: request.to,
    value: hexToBigInt(request.value),
  });
}

export async function waitForClientTransaction(txHash: Hex) {
  return getEscrowPublicClient().waitForTransactionReceipt({
    confirmations: 1,
    hash: txHash,
  });
}
