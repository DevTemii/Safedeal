"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendPreparedTransaction, waitForClientTransaction } from "@/lib/contracts/client";
import type { PreparedTransactionRequest } from "@/lib/contracts/escrow";

type PreparedActionUiState =
  | "idle"
  | "wallet_pending"
  | "confirming"
  | "confirmed"
  | "failed";

interface PreparedActionButtonProps {
  buttonLabel: string;
  confirmLabel?: string;
  confirmUrl: string;
  prepareUrl: string;
  successLabel: string;
  walletLabel?: string;
}

interface PreparedActionResponse {
  transaction: PreparedTransactionRequest;
}

async function postJson<T>(url: string, body?: Record<string, unknown>) {
  const response = await fetch(url, {
    body: body ? JSON.stringify(body) : undefined,
    headers: body
      ? {
          "Content-Type": "application/json",
        }
      : undefined,
    method: "POST",
  });

  const payload = (await response.json().catch(() => null)) as
    | (T & {
        error?: string;
      })
    | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "Request failed.");
  }

  if (!payload) {
    throw new Error("The server returned an empty response.");
  }

  return payload;
}

export function PreparedActionButton({
  buttonLabel,
  confirmLabel = "Confirming...",
  confirmUrl,
  prepareUrl,
  successLabel,
  walletLabel = "Waiting For Wallet...",
}: PreparedActionButtonProps) {
  const router = useRouter();
  const [uiState, setUiState] = useState<PreparedActionUiState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  async function handleAction() {
    try {
      setUiState("wallet_pending");
      setErrorMessage(null);
      setStatusMessage(null);

      const preparedAction = await postJson<PreparedActionResponse>(prepareUrl);
      const txHash = await sendPreparedTransaction(preparedAction.transaction);

      await waitForClientTransaction(txHash);

      setUiState("confirming");

      await postJson(confirmUrl, {
        txHash,
      });

      setUiState("confirmed");
      setStatusMessage(successLabel);
      router.refresh();
    } catch (error) {
      setUiState("failed");
      setStatusMessage(null);
      setErrorMessage(
        error instanceof Error ? error.message : "Action failed."
      );
    }
  }

  return (
    <div className="space-y-2">
      <button
        className="inline-flex h-9 items-center justify-center rounded-full bg-[#002DE3] px-4 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#B7C6FF]"
        disabled={uiState === "wallet_pending" || uiState === "confirming"}
        onClick={handleAction}
        type="button"
      >
        {uiState === "wallet_pending"
          ? walletLabel
          : uiState === "confirming"
            ? confirmLabel
            : uiState === "confirmed"
              ? "Confirmed"
              : buttonLabel}
      </button>

      {statusMessage ? (
        <p className="text-[11px] font-medium text-[#21764D]">{statusMessage}</p>
      ) : null}

      {errorMessage ? (
        <p className="text-[11px] font-medium text-[#C0392B]">{errorMessage}</p>
      ) : null}
    </div>
  );
}
