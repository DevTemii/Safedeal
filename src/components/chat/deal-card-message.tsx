"use client";

import Link from "next/link";
import { PreparedActionButton } from "@/components/payment/prepared-action-button";
import { RaiseIssueButton } from "@/components/payment/raise-issue-button";
import type { MessageMetadata } from "@/lib/chat/types";
import { cn } from "@/lib/utils";

interface DealCardMessageProps {
  currentUserId: string;
  metadata: MessageMetadata;
}

function readText(metadata: MessageMetadata, key: string) {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function formatStatusLabel(status: string | null) {
  if (!status) {
    return null;
  }

  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusBadgeClass(status: string | null) {
  switch (status?.toLowerCase()) {
    case "draft":
    case "approved":
      return "bg-[#eff2ff] text-[#2f48d6]";
    case "funding_pending":
      return "bg-[#fff3dc] text-[#9c6a15]";
    case "funded":
    case "delivered":
    case "completed":
      return "bg-[#e9f7ef] text-[#21764d]";
    case "disputed":
      return "bg-[#ffe7e7] text-[#b34040]";
    default:
      return "bg-[#eff2ff] text-[#2f48d6]";
  }
}

export function DealCardMessage({
  currentUserId,
  metadata,
}: DealCardMessageProps) {
  const status = readText(metadata, "status");
  const title = readText(metadata, "title") ?? "Deal summary";
  const summary = readText(metadata, "summary");
  const dealId = readText(metadata, "dealId");
  const securePaymentHref = readText(metadata, "securePaymentHref");
  const buyerId = readText(metadata, "buyerId");
  const sellerId = readText(metadata, "sellerId");
  const canSecurePayment =
    securePaymentHref &&
    buyerId === currentUserId &&
    (status === "draft" || status === "approved" || status === "funding_pending");
  const canMarkDelivered =
    dealId && sellerId === currentUserId && status === "funded";
  const canConfirmDelivery =
    dealId && buyerId === currentUserId && status === "delivered";

  return (
    <div className="w-full max-w-[283px] rounded-tl-[13px] rounded-tr-[13px] rounded-bl-[13px] border border-[#E6E6E6] bg-[#F8F8F8] px-3 py-[10px] shadow-[0px_2px_18px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#002DE3] text-sm text-white">
            &bull;
          </span>
          <p className="text-[12px] font-semibold leading-[18px] text-[#0F0F0F]">
            {title}
          </p>
        </div>

        {status ? (
          <span
            className={cn(
              "rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.04em]",
              statusBadgeClass(status)
            )}
          >
            {formatStatusLabel(status)}
          </span>
        ) : null}
      </div>

      {summary ? (
        <p className="mt-2 text-[12px] leading-[18px] text-[#0F0F0F]">
          {summary}
        </p>
      ) : null}

      {canSecurePayment ? (
        <div className="mt-3">
          <Link
            className="inline-flex h-9 items-center justify-center rounded-full bg-[#002DE3] px-4 text-[12px] font-semibold text-white"
            href={securePaymentHref}
          >
            Secure Payment
          </Link>
        </div>
      ) : null}

      {canMarkDelivered ? (
        <div className="mt-3">
          <PreparedActionButton
            buttonLabel="Mark Delivered"
            confirmLabel="Confirming Delivery..."
            confirmUrl={`/api/deals/${dealId}/deliver/confirm`}
            prepareUrl={`/api/deals/${dealId}/deliver/prepare`}
            successLabel="Delivery confirmed onchain."
            walletLabel="Open MiniPay..."
          />
        </div>
      ) : null}

      {canConfirmDelivery ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <PreparedActionButton
            buttonLabel="Confirm Delivery"
            confirmLabel="Confirming Release..."
            confirmUrl={`/api/deals/${dealId}/release/confirm`}
            prepareUrl={`/api/deals/${dealId}/release/prepare`}
            successLabel="Payment released onchain."
            walletLabel="Open MiniPay..."
          />
          <RaiseIssueButton dealId={dealId} />
        </div>
      ) : null}
    </div>
  );
}
