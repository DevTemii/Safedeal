import Link from "next/link";
import { redirect } from "next/navigation";
import { SecurePaymentPanel } from "@/components/payment/secure-payment-panel";
import {
  assertDealActorRole,
  loadDealActionContext,
} from "@/lib/validators/deal-actions";

interface PageProps {
  params: Promise<{
    dealId: string;
  }>;
}

export default async function SecurePaymentPage({ params }: PageProps) {
  const { dealId } = await params;
  const actionContext = await loadDealActionContext(dealId);

  try {
    assertDealActorRole(actionContext.actorRole, "buyer");
  } catch {
    redirect(`/chat/${actionContext.deal.conversation_id}`);
  }

  return (
    <main className="min-h-screen bg-[#F5F7FB]">
      <div className="mx-auto flex min-h-screen w-full max-w-[393px] flex-col px-4 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+18px)]">
        <div className="mb-5 flex items-center gap-3">
          <Link
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#DADDE7] bg-white text-[#171616]"
            href={`/chat/${actionContext.deal.conversation_id}`}
          >
            <svg
              fill="none"
              height="18"
              viewBox="0 0 18 18"
              width="18"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11.25 3.75L6 9L11.25 14.25"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          </Link>

          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-[#878686]">
              SafeDeal
            </p>
            <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-[#171616]">
              Confirm Funding
            </h2>
          </div>
        </div>

        <SecurePaymentPanel
          amountMinor={actionContext.deal.amount_minor}
          conversationId={actionContext.deal.conversation_id}
          deadlineAt={actionContext.deal.deadline_at}
          dealId={actionContext.deal.id}
          initialStatus={actionContext.deal.status}
          sellerWalletAddress={actionContext.sellerWalletAddress}
          title={actionContext.deal.title}
        />
      </div>
    </main>
  );
}
