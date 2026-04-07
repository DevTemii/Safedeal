import {
  createPublicClient,
  encodeFunctionData,
  getAddress,
  isAddress,
  isHex,
  parseEventLogs,
  http,
  type Address,
  type Hex,
  type Transaction,
  type TransactionReceipt,
} from "viem";
import { getSafeDealChain, getSafeDealChainId, getSafeDealRpcUrl } from "@/lib/contracts/network";

export const safeDealEscrowAbi = [
  {
    type: "function",
    name: "createDeal",
    stateMutability: "nonpayable",
    inputs: [
      { name: "seller", type: "address" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "deadline", type: "uint64" },
    ],
    outputs: [{ name: "dealId", type: "uint256" }],
  },
  {
    type: "function",
    name: "fundDeal",
    stateMutability: "nonpayable",
    inputs: [{ name: "dealId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "markDelivered",
    stateMutability: "nonpayable",
    inputs: [{ name: "dealId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "releaseDeal",
    stateMutability: "nonpayable",
    inputs: [{ name: "dealId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "deals",
    stateMutability: "view",
    inputs: [{ name: "dealId", type: "uint256" }],
    outputs: [
      { name: "buyer", type: "address" },
      { name: "seller", type: "address" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "deadline", type: "uint64" },
      { name: "status", type: "uint8" },
      { name: "createdAt", type: "uint64" },
      { name: "fundedAt", type: "uint64" },
      { name: "deliveredAt", type: "uint64" },
      { name: "disputedAt", type: "uint64" },
      { name: "releasedAt", type: "uint64" },
    ],
  },
  {
    anonymous: false,
    type: "event",
    name: "DealCreated",
    inputs: [
      { indexed: true, name: "dealId", type: "uint256" },
      { indexed: true, name: "buyer", type: "address" },
      { indexed: true, name: "seller", type: "address" },
      { indexed: false, name: "token", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "deadline", type: "uint64" },
    ],
  },
  {
    anonymous: false,
    type: "event",
    name: "DealFunded",
    inputs: [
      { indexed: true, name: "dealId", type: "uint256" },
      { indexed: true, name: "buyer", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
  },
  {
    anonymous: false,
    type: "event",
    name: "DealDelivered",
    inputs: [
      { indexed: true, name: "dealId", type: "uint256" },
      { indexed: true, name: "seller", type: "address" },
    ],
  },
  {
    anonymous: false,
    type: "event",
    name: "DealReleased",
    inputs: [
      { indexed: true, name: "dealId", type: "uint256" },
      { indexed: true, name: "buyer", type: "address" },
      { indexed: true, name: "seller", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
  },
] as const;

export interface PreparedTransactionRequest {
  chainId: number;
  data: Hex;
  to: Address;
  value: Hex;
}

export interface ConfirmedEscrowTransaction {
  blockTimestampIso: string;
  receipt: TransactionReceipt;
  transaction: Transaction;
}

function requireConfiguredAddress(
  value: string | undefined,
  fieldName: string
): Address {
  if (!value || !isAddress(value)) {
    throw new Error(`Missing or invalid ${fieldName}.`);
  }

  return getAddress(value);
}

export function getEscrowAddress() {
  return requireConfiguredAddress(
    process.env.NEXT_PUBLIC_ESCROW_ADDRESS ?? process.env.ESCROW_ADDRESS,
    "NEXT_PUBLIC_ESCROW_ADDRESS"
  );
}

export function parseTransactionHash(value: unknown, fieldName: string): Hex {
  if (typeof value !== "string" || !isHex(value)) {
    throw new Error(`${fieldName} must be a valid transaction hash.`);
  }

  return value;
}

export function getEscrowPublicClient() {
  return createPublicClient({
    chain: getSafeDealChain(),
    transport: http(getSafeDealRpcUrl()),
  });
}

export function createPreparedTransaction(
  data: Hex,
  to: Address
): PreparedTransactionRequest {
  return {
    chainId: getSafeDealChainId(),
    data,
    to,
    value: "0x0",
  };
}

export function encodeCreateDealTransaction({
  amount,
  deadline,
  seller,
  token,
}: {
  amount: bigint;
  deadline: bigint;
  seller: Address;
  token: Address;
}) {
  return createPreparedTransaction(
    encodeFunctionData({
      abi: safeDealEscrowAbi,
      args: [seller, token, amount, deadline],
      functionName: "createDeal",
    }),
    getEscrowAddress()
  );
}

export function encodeFundDealTransaction(contractDealId: bigint) {
  return createPreparedTransaction(
    encodeFunctionData({
      abi: safeDealEscrowAbi,
      args: [contractDealId],
      functionName: "fundDeal",
    }),
    getEscrowAddress()
  );
}

export function encodeMarkDeliveredTransaction(contractDealId: bigint) {
  return createPreparedTransaction(
    encodeFunctionData({
      abi: safeDealEscrowAbi,
      args: [contractDealId],
      functionName: "markDelivered",
    }),
    getEscrowAddress()
  );
}

export function encodeReleaseDealTransaction(contractDealId: bigint) {
  return createPreparedTransaction(
    encodeFunctionData({
      abi: safeDealEscrowAbi,
      args: [contractDealId],
      functionName: "releaseDeal",
    }),
    getEscrowAddress()
  );
}

export async function getEscrowDeal(contractDealId: bigint) {
  return getEscrowPublicClient().readContract({
    abi: safeDealEscrowAbi,
    address: getEscrowAddress(),
    args: [contractDealId],
    functionName: "deals",
  });
}

export async function waitForConfirmedEscrowTransaction(
  txHash: Hex
): Promise<ConfirmedEscrowTransaction> {
  const publicClient = getEscrowPublicClient();
  const receipt = await publicClient.waitForTransactionReceipt({
    confirmations: 1,
    hash: txHash,
  });
  const transaction = await publicClient.getTransaction({ hash: txHash });
  const block = await publicClient.getBlock({ blockHash: receipt.blockHash });

  return {
    blockTimestampIso: new Date(Number(block.timestamp) * 1000).toISOString(),
    receipt,
    transaction,
  };
}

export function getDealCreatedLog(receipt: TransactionReceipt) {
  return parseEventLogs({
    abi: safeDealEscrowAbi,
    eventName: "DealCreated",
    logs: receipt.logs,
    strict: false,
  })[0];
}

export function getDealFundedLog(receipt: TransactionReceipt) {
  return parseEventLogs({
    abi: safeDealEscrowAbi,
    eventName: "DealFunded",
    logs: receipt.logs,
    strict: false,
  })[0];
}

export function getDealDeliveredLog(receipt: TransactionReceipt) {
  return parseEventLogs({
    abi: safeDealEscrowAbi,
    eventName: "DealDelivered",
    logs: receipt.logs,
    strict: false,
  })[0];
}

export function getDealReleasedLog(receipt: TransactionReceipt) {
  return parseEventLogs({
    abi: safeDealEscrowAbi,
    eventName: "DealReleased",
    logs: receipt.logs,
    strict: false,
  })[0];
}
