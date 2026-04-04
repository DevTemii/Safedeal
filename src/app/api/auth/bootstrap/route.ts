import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  extractWalletAddressFromIdentities,
  normalizeWalletAddress,
} from "@/lib/auth/wallet-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const requestedWallet = normalizeWalletAddress(body?.walletAddress);

    if (!requestedWallet) {
      return NextResponse.json(
        { error: "Invalid wallet address" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    console.log("[bootstrap] getUser:", userData, userError);

    if (userError || !userData?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const identitiesResult = await supabase.auth.getUserIdentities();

    console.log(
      "[bootstrap] getUserIdentities full response:",
      JSON.stringify(identitiesResult, null, 2)
    );

    const extractedWallet =
      extractWalletAddressFromIdentities(
        identitiesResult.data?.identities ?? null
      ) ?? null;

    console.log("[bootstrap] extracted wallet from identities:", {
      requestedWallet: requestedWallet.toLowerCase(),
      extractedWallet: extractedWallet?.toLowerCase() ?? null,
    });

    if (!extractedWallet) {
      return NextResponse.json(
        { error: "No wallet identity found" },
        { status: 400 }
      );
    }

    if (extractedWallet.toLowerCase() !== requestedWallet.toLowerCase()) {
      return NextResponse.json(
        { error: "Wallet mismatch" },
        { status: 409 }
      );
    }

    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userData.user.id,
          wallet_address: extractedWallet.toLowerCase(),
        },
        { onConflict: "id" }
      );

    if (upsertError) {
      console.error("[bootstrap] upsert error:", upsertError);

      return NextResponse.json(
        { error: "Profile creation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[bootstrap] fatal:", err);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
