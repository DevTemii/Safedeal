import type { MessageMetadata } from "@/lib/chat/types";

interface DealMessageMetadataInput {
  amountMinor: number;
  buyerId: string;
  dealId: string;
  deliveryLabel?: string | null;
  sellerId: string;
  status: string;
  title: string;
}

function formatUsdcAmount(amountMinor: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amountMinor / 1_000_000);
}

export function buildDealSummaryLine({
  amountMinor,
  deliveryLabel,
}: {
  amountMinor: number;
  deliveryLabel?: string | null;
}) {
  const parts = [`${formatUsdcAmount(amountMinor)} USDC`];

  if (deliveryLabel) {
    parts.push(deliveryLabel);
  }

  return parts.join(" - ");
}

export function buildDealCardMetadata({
  amountMinor,
  buyerId,
  dealId,
  deliveryLabel,
  sellerId,
  status,
  title,
}: DealMessageMetadataInput): MessageMetadata {
  return {
    buyerId,
    dealId,
    securePaymentHref: `/deals/${dealId}/secure-payment`,
    sellerId,
    status,
    summary: buildDealSummaryLine({
      amountMinor,
      deliveryLabel,
    }),
    title,
    type: "deal_card",
  };
}

export function buildPaymentEventMetadata({
  description,
  status,
}: {
  description: string;
  status: string;
}): MessageMetadata {
  return {
    description,
    status,
    type: "payment_event",
  };
}

export function buildDeliveryEventMetadata({
  description,
  status,
}: {
  description: string;
  status: string;
}): MessageMetadata {
  return {
    description,
    status,
    type: "delivery_event",
  };
}
