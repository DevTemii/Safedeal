"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  SAFEDEAL_AUTH_STATEMENT,
  summarizeUserIdentities,
} from "@/lib/auth/wallet-auth";
import { createClient } from "@/lib/supabase/client";
import { isMiniPayAvailable, requestMiniPayAccount } from "@/lib/wallet/minipay";

type AvailabilityState = "checking" | "ready" | "unsupported";

export function ConnectMiniPayButton() {
  const [availability, setAvailability] = useState<AvailabilityState>("checking");
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setAvailability(isMiniPayAvailable() ? "ready" : "unsupported");
  }, []);

  async function handleConnect() {
    setError(null);
    setIsConnecting(true);

    try {
      if (typeof window === "undefined") {
        throw new Error("MiniPay connection requires a browser environment.");
      }

      console.log("[SafeDeal] Starting MiniPay connect flow");

      const walletAddress = await requestMiniPayAccount();
      console.log("[SafeDeal] MiniPay account:", walletAddress);

      const supabase = createClient();
      const authUrl = new URL("/login", window.location.origin).toString();

      const signInResult = await supabase.auth.signInWithWeb3({
        chain: "ethereum",
        statement: SAFEDEAL_AUTH_STATEMENT,
        options: {
          url: authUrl,
        },
      });

      const { data, error: authError } = signInResult;

      console.log("[SafeDeal] signInWithWeb3 result:", {
        authUrl,
        requestedWalletAddress: walletAddress,
        error: authError?.message ?? null,
        hasSession: Boolean(data.session),
        userId: data.user?.id ?? null,
        identities: summarizeUserIdentities(data.user?.identities),
      });

      if (authError) {
        throw authError;
      }

      if (!data?.user) {
        throw new Error("Supabase did not return an authenticated app user.");
      }

      const currentUserResult = await supabase.auth.getUser();

      console.log("[SafeDeal] getUser() after signInWithWeb3:", {
        error: currentUserResult.error?.message ?? null,
        userId: currentUserResult.data.user?.id ?? null,
        identities: summarizeUserIdentities(currentUserResult.data.user?.identities),
      });

      const bootstrapResponse = await fetch("/api/auth/bootstrap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress,
        }),
      });

      const bootstrapPayload = (await bootstrapResponse
        .json()
        .catch(() => null)) as { error?: string; ok?: boolean } | null;

      console.log("[SafeDeal] bootstrap result:", {
        status: bootstrapResponse.status,
        ok: bootstrapResponse.ok,
        bootstrapPayload,
      });

      if (!bootstrapResponse.ok) {
        await supabase.auth.signOut();
        throw new Error(
          bootstrapPayload?.error ?? "Unable to create your SafeDeal profile."
        );
      }

      if (typeof window !== "undefined") {
        window.location.assign("/inbox");
      }
    } catch (connectError) {
      console.error("[SafeDeal] Connect flow failed:", connectError);

      setError(
        connectError instanceof Error
          ? connectError.message
          : "MiniPay connection failed."
      );
    } finally {
      setIsConnecting(false);
    }
  }

  const isBusy = availability === "checking" || isConnecting;
  const buttonLabel =
    availability === "checking"
      ? "Checking MiniPay..."
      : isConnecting
        ? "Opening inbox..."
        : "Connect MiniPay";

  return (
    <div className="space-y-3">
      <Button
        className="w-full"
        size="lg"
        onClick={handleConnect}
        disabled={availability !== "ready" || isBusy}
      >
        {buttonLabel}
      </Button>

      {availability === "unsupported" ? (
        <p className="text-sm leading-6 text-destructive">
          MiniPay was not detected. Open SafeDeal inside the MiniPay browser and
          try again.
        </p>
      ) : null}

      {error ? (
        <p className="text-sm leading-6 text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
