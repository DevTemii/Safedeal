import {
  createPublicClient,
  encodeFunctionData,
  getAddress,
  http,
  isAddress,
  type Address,
  type Hex,
} from "viem";
import { getSafeDealChain, getSafeDealRpcUrl } from "@/lib/contracts/network";

export const erc20Abi = [
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      {
        name: "owner",
        type: "address",
      },
      {
        name: "spender",
        type: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "spender",
        type: "address",
      },
      {
        name: "amount",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
  },
] as const;

function requireConfiguredAddress(
  value: string | undefined,
  fieldName: string
): Address {
  if (!value || !isAddress(value)) {
    throw new Error(`Missing or invalid ${fieldName}.`);
  }

  return getAddress(value);
}

export function getUsdcAddress() {
  return requireConfiguredAddress(
    process.env.NEXT_PUBLIC_USDC_ADDRESS ?? process.env.USDC_ADDRESS,
    "NEXT_PUBLIC_USDC_ADDRESS"
  );
}

export function encodeApproveUsdcTransaction({
  amount,
  spender,
}: {
  amount: bigint;
  spender: Address;
}): Hex {
  return encodeFunctionData({
    abi: erc20Abi,
    args: [spender, amount],
    functionName: "approve",
  });
}

export async function getUsdcAllowance({
  owner,
  spender,
}: {
  owner: Address;
  spender: Address;
}) {
  const publicClient = createPublicClient({
    chain: getSafeDealChain(),
    transport: http(getSafeDealRpcUrl()),
  });

  return publicClient.readContract({
    abi: erc20Abi,
    address: getUsdcAddress(),
    args: [owner, spender],
    functionName: "allowance",
  });
}
