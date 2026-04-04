import type { MiniPayProvider } from "@/lib/wallet/minipay";

declare global {
  interface Window {
    ethereum?: MiniPayProvider;
  }
}

export {};
