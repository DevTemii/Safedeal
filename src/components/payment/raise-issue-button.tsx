"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type RaiseIssueUiState = "idle" | "submitting" | "confirmed" | "failed";

interface RaiseIssueButtonProps {
  dealId: string;
}

async function postJson(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        error?: string;
      }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "Request failed.");
  }
}

export function RaiseIssueButton({ dealId }: RaiseIssueButtonProps) {
  const router = useRouter();
  const [uiState, setUiState] = useState<RaiseIssueUiState>("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleRaiseIssue() {
    const reason =
      typeof window !== "undefined"
        ? window.prompt("Briefly describe the issue with this delivery.")
        : null;

    if (!reason || !reason.trim()) {
      return;
    }

    try {
      setUiState("submitting");
      setStatusMessage(null);
      setErrorMessage(null);

      await postJson(`/api/deals/${dealId}/disputes`, {
        details: reason.trim(),
        reason: reason.trim(),
      });

      setUiState("confirmed");
      setStatusMessage("Issue raised. Release is now blocked.");
      router.refresh();
    } catch (error) {
      setUiState("failed");
      setStatusMessage(null);
      setErrorMessage(error instanceof Error ? error.message : "Unable to raise an issue.");
    }
  }

  return (
    <div className="space-y-2">
      <button
        className="inline-flex h-9 items-center justify-center rounded-full border border-[#E6E6E6] bg-white px-4 text-[12px] font-medium text-[#171616] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={uiState === "submitting"}
        onClick={handleRaiseIssue}
        type="button"
      >
        {uiState === "submitting"
          ? "Submitting..."
          : uiState === "confirmed"
            ? "Issue Raised"
            : "Raise Issue"}
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
