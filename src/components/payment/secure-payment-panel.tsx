"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { sendPreparedTransaction, waitForClientTransaction } from "@/lib/contracts/client";
import type { PreparedTransactionRequest } from "@/lib/contracts/escrow";

type FundingUiState =
  | "idle"
  | "wallet_pending"
  | "confirming"
  | "confirmed"
  | "failed";

interface SecurePaymentPanelProps {
  amountMinor: number;
  conversationId: string;
  deadlineAt: string;
  dealId: string;
  initialStatus: string;
  sellerWalletAddress: string;
  title: string;
}

interface FundPrepareResponse {
  approvalRequired?: boolean;
  approveTransaction?: PreparedTransactionRequest | null;
  step: "create" | "fund";
  transaction: PreparedTransactionRequest;
}

function formatAmount(amountMinor: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amountMinor / 1_000_000);
}

function formatDeadline(deadlineAt: string) {
  const deadline = new Date(deadlineAt);

  if (Number.isNaN(deadline.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(deadline);
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

export function SecurePaymentPanel({
  amountMinor,
  conversationId,
  deadlineAt,
  dealId,
  initialStatus,
  sellerWalletAddress,
  title,
}: SecurePaymentPanelProps) {
  const router = useRouter();
  const [uiState, setUiState] = useState<FundingUiState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [confirmedStage, setConfirmedStage] = useState<"create" | "fund" | null>(
    null
  );
  const amountLabel = useMemo(() => formatAmount(amountMinor), [amountMinor]);
  const deadlineLabel = useMemo(() => formatDeadline(deadlineAt), [deadlineAt]);
  const isAlreadyFunded = initialStatus === "funded";

  async function confirmFundingStage(
    stage: "create" | "fund",
    txHash: `0x${string}`
  ) {
    setUiState("confirming");
    setStatusMessage(
      stage === "create"
        ? "Confirming escrow setup onchain..."
        : "Confirming secure payment onchain..."
    );

    return postJson(`/api/deals/${dealId}/fund/confirm`, {
      stage,
      txHash,
    });
  }

  async function runFundingFlow() {
    setUiState("wallet_pending");
    setErrorMessage(null);
    setStatusMessage("Preparing secure payment...");

    const initialPreparation = await postJson<FundPrepareResponse>(
      `/api/deals/${dealId}/fund/prepare`
    );

    let fundPreparation = initialPreparation;

    if (initialPreparation.step === "create") {
      setStatusMessage("Approve the escrow setup in MiniPay...");

      const createTxHash = await sendPreparedTransaction(initialPreparation.transaction);
      await waitForClientTransaction(createTxHash);
      await confirmFundingStage("create", createTxHash);
      setConfirmedStage("create");

      setUiState("wallet_pending");
      setStatusMessage("Preparing secure payment...");

      fundPreparation = await postJson<FundPrepareResponse>(
        `/api/deals/${dealId}/fund/prepare`
      );
    }

    if (fundPreparation.approvalRequired && fundPreparation.approveTransaction) {
      setUiState("wallet_pending");
      setStatusMessage("Approve USDC spending in MiniPay...");

      const approveTxHash = await sendPreparedTransaction(
        fundPreparation.approveTransaction
      );
      await waitForClientTransaction(approveTxHash);
    }

    setUiState("wallet_pending");
    setStatusMessage("Approve the secure payment in MiniPay...");

    const fundTxHash = await sendPreparedTransaction(fundPreparation.transaction);
    await waitForClientTransaction(fundTxHash);
    await confirmFundingStage("fund", fundTxHash);

    setConfirmedStage("fund");
    setUiState("confirmed");
    setStatusMessage("Payment secured. The seller can now deliver.");
    router.refresh();
  }

  async function handleSecurePayment() {
    try {
      await runFundingFlow();
    } catch (error) {
      setUiState("failed");
      setStatusMessage(null);
      setErrorMessage(
        error instanceof Error ? error.message : "Secure payment failed."
      );
    }
  }

  return (
    <section className="rounded-[28px] border border-[#E6E6E6] bg-white p-5 shadow-[0px_20px_40px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#002DE3]">
            Secure Payment
          </p>
          <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.03em] text-[#171616]">
            {title}
          </h1>
        </div>

        <div className="rounded-full bg-[#EEF2FF] px-3 py-2 text-[12px] font-semibold text-[#3F37D9]">
          {isAlreadyFunded ? "Funded" : "Pending"}
        </div>
      </div>

      <dl className="mt-6 space-y-4 rounded-[24px] bg-[#F7F8FC] p-4">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#878686]">
            Amount
          </dt>
          <dd className="text-[18px] font-semibold text-[#171616]">
            {amountLabel} USDC
          </dd>
        </div>

        <div className="flex items-center justify-between gap-4">
          <dt className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#878686]">
            Seller
          </dt>
          <dd className="text-right text-[13px] font-medium text-[#171616]">
            {sellerWalletAddress}
          </dd>
        </div>

        <div className="flex items-center justify-between gap-4">
          <dt className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#878686]">
            Deadline
          </dt>
          <dd className="text-right text-[13px] font-medium text-[#171616]">
            {deadlineLabel}
          </dd>
        </div>
      </dl>

      <div className="mt-5 rounded-[22px] border border-[#E6E6E6] bg-white px-4 py-3">
        <p className="text-[12px] leading-6 text-[#555555]">
          SafeDeal secures your payment in escrow and only releases it after you
          confirm delivery.
        </p>
        {statusMessage ? (
          <p className="mt-2 text-[12px] font-medium text-[#002DE3]">
            {statusMessage}
          </p>
        ) : null}
        {errorMessage ? (
          <p className="mt-2 text-[12px] font-medium text-[#C0392B]">
            {errorMessage}
          </p>
        ) : null}
        {confirmedStage ? (
          <p className="mt-2 text-[12px] font-medium text-[#21764D]">
            {confirmedStage === "create"
              ? "Escrow deal initialized."
              : "Onchain payment confirmed."}
          </p>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <button
          className="inline-flex h-12 items-center justify-center rounded-full bg-[#002DE3] px-5 text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#B7C6FF]"
          disabled={isAlreadyFunded || uiState === "wallet_pending" || uiState === "confirming"}
          onClick={handleSecurePayment}
          type="button"
        >
          {isAlreadyFunded
            ? "Payment Secured"
            : uiState === "wallet_pending"
              ? "Waiting For Wallet..."
              : uiState === "confirming"
                ? "Confirming..."
                : uiState === "confirmed"
                  ? "Payment Secured"
                  : "Secure Payment"}
        </button>

        <button
          className="inline-flex h-12 items-center justify-center rounded-full border border-[#E6E6E6] bg-white px-5 text-[14px] font-medium text-[#171616]"
          onClick={() => router.push(`/chat/${conversationId}`)}
          type="button"
        >
          Back To Chat
        </button>
      </div>
    </section>
  );
}
