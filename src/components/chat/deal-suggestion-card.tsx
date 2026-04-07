"use client";

import Link from "next/link";
import type { MessageMetadata } from "@/lib/chat/types";

interface DealSuggestionCardProps {
  body: string;
  metadata: MessageMetadata;
  onIgnore: () => void;
}

function readText(metadata: MessageMetadata, key: string) {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getSummaryLine(body: string, metadata: MessageMetadata) {
  const title =
    readText(metadata, "title") ?? readText(metadata, "dealTitle") ?? null;
  const amount =
    readText(metadata, "amountLabel") ??
    readText(metadata, "amount") ??
    readText(metadata, "priceLabel");
  const timing =
    readText(metadata, "targetDateLabel") ??
    readText(metadata, "deliveryWindow") ??
    readText(metadata, "timing");

  const parts = [title, amount, timing].filter(
    (part): part is string => Boolean(part)
  );

  if (parts.length) {
    return parts.join(" \u2022 ");
  }

  return body;
}

function getCreateDealHref(metadata: MessageMetadata) {
  return (
    readText(metadata, "createDealHref") ??
    readText(metadata, "dealReviewHref") ??
    readText(metadata, "href")
  );
}

export function DealSuggestionCard({
  body,
  metadata,
  onIgnore,
}: DealSuggestionCardProps) {
  const createDealHref = getCreateDealHref(metadata);
  const summaryLine = getSummaryLine(body, metadata);

  return (
    <div className="w-full max-w-[283px] rounded-tl-[13px] rounded-tr-[13px] rounded-bl-[13px] border border-[#3F37D9] bg-[#EEEEEE] px-[9px] pb-[10px] pt-[7px] shadow-[0px_2px_18px_rgba(0,0,0,0.08)]">
      <div className="flex items-center gap-[7px]">
        <svg
          fill="none"
          height="20"
          viewBox="0 0 20 20"
          width="20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10.833 2.5L11.79 5.377C11.93 5.797 12.259 6.126 12.679 6.266L15.556 7.223L12.679 8.181C12.259 8.321 11.93 8.65 11.79 9.07L10.833 11.947L9.876 9.07C9.736 8.65 9.407 8.321 8.987 8.181L6.11 7.223L8.987 6.266C9.407 6.126 9.736 5.797 9.876 5.377L10.833 2.5Z"
            fill="#002DE3"
          />
          <path
            d="M5 10.833L5.455 12.201C5.557 12.507 5.797 12.747 6.103 12.849L7.471 13.304L6.103 13.76C5.797 13.862 5.557 14.102 5.455 14.408L5 15.776L4.544 14.408C4.442 14.102 4.202 13.862 3.896 13.76L2.529 13.304L3.896 12.849C4.202 12.747 4.442 12.507 4.544 12.201L5 10.833Z"
            fill="#002DE3"
          />
        </svg>
        <span className="text-[12px] font-semibold leading-[18px] text-[#0F0F0F]">
          Suggested
        </span>
      </div>

      <p className="mt-[6px] line-clamp-2 text-[12px] leading-[18px] text-[#0F0F0F]">
        {summaryLine}
      </p>

      <div className="mt-[7px] flex items-center gap-[6px]">
        {createDealHref ? (
          <Link
            className="inline-flex h-6 items-center justify-center rounded-[16px] bg-[#002DE3] px-[11px] text-[9px] font-bold leading-[24px] text-white"
            href={createDealHref}
          >
            Create Deal
          </Link>
        ) : (
          <button
            className="inline-flex h-6 items-center justify-center rounded-[16px] bg-[#002DE3] px-[11px] text-[9px] font-bold leading-[24px] text-white"
            type="button"
          >
            Create Deal
          </button>
        )}

        <button
          className="inline-flex h-6 items-center justify-center rounded-[16px] px-[11px] text-[9px] font-medium leading-[24px] text-black"
          onClick={onIgnore}
          type="button"
        >
          Ignore
        </button>
      </div>
    </div>
  );
}
