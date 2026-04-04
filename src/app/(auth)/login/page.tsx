import { redirect } from "next/navigation";
import { ConnectMiniPayButton } from "@/components/shared/connect-minipay-button";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      redirect("/inbox");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-background to-muted/40 px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="space-y-3 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            SafeDeal Phase 2
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">
            Sign in with MiniPay
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Connect MiniPay, create a verified SafeDeal session, and bootstrap
            your profile before entering the app.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <ConnectMiniPayButton />
          <p className="text-center text-xs leading-5 text-muted-foreground">
            Open this page inside MiniPay&apos;s in-app browser so
            <code className="mx-1 rounded bg-muted px-1.5 py-0.5">
              window.ethereum.isMiniPay
            </code>
            is available.
          </p>
        </div>
      </section>
    </main>
  );
}
