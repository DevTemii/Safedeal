# SafeDeal Celo Sepolia Verification Checklist

Use this checklist only on Celo Sepolia for the current verification pass.

## Prerequisites

- `NEXT_PUBLIC_NETWORK_ID=44787`
- `NEXT_PUBLIC_RPC_URL=https://sepolia-forno.celo-testnet.org`
- `NEXT_PUBLIC_USDC_ADDRESS` points to the Sepolia USDC test token
- `NEXT_PUBLIC_ESCROW_ADDRESS` points to the deployed `SafeDealEscrow`
- buyer and seller both have SafeDeal accounts
- buyer has enough Sepolia USDC and gas
- seller has enough Sepolia gas

## 1. Create deal

- Open a conversation and create a deal draft.
- Confirm the chat immediately shows:
  - a system timeline entry for the draft
  - a draft deal card
- Confirm the deal row exists in Supabase with `status = draft`.
- Confirm no onchain tx hashes are stored yet.

## 2. Fund deal

- As the buyer, open the secure payment flow from the draft deal card.
- If this is the first onchain action for the deal, confirm the flow prepares escrow creation first, then approval/funding.
- Complete the wallet approvals and wait for confirmation.
- Confirm the backend stores:
  - `contract_deal_id`
  - `tx_create_hash` if the escrow deal was initialized in this flow
  - `tx_fund_hash`
  - `status = funded`
  - `escrow_status = funded`
- Confirm the chat shows:
  - `Payment secured` event
  - updated funded deal card

## 3. Seller marks delivered

- Sign in as the seller.
- Confirm `Mark Delivered` is visible only on a funded deal.
- Trigger the delivery action and wait for onchain confirmation.
- Confirm the backend stores:
  - `tx_deliver_hash`
  - `status = delivered`
  - `delivery_status = confirmed`
- Confirm the chat shows:
  - `Delivery marked` event
  - updated delivered deal card

## 4. Buyer confirms release

- Sign back in as the buyer.
- Confirm the delivered deal card shows:
  - `Confirm Delivery`
  - `Raise Issue`
- Tap `Confirm Delivery` and wait for onchain confirmation.
- Confirm the backend stores:
  - `tx_release_hash`
  - `status = completed`
  - `escrow_status = released`
- Confirm the chat shows:
  - `Payment released` event
  - completed deal card
- Confirm the completed deal card shows no more action buttons.

## 5. Raise issue and verify release is blocked

- Start again from a funded deal and have the seller mark it delivered.
- As the buyer, use `Raise Issue` instead of confirming delivery.
- Confirm the backend stores:
  - `status = disputed`
  - `dispute_status = open`
- Confirm the chat shows:
  - dispute system message
  - disputed deal card
- Confirm release is blocked:
  - `Confirm Delivery` is no longer available in the chat state, or
  - `POST /api/deals/:id/release/prepare` returns `409`
  - `POST /api/deals/:id/release/confirm` returns `409`

## Pass criteria

- Every state transition happens only after confirmed onchain receipts.
- Failed or mismatched confirmations do not mutate `funded`, `delivered`, or `completed`.
- Repeated confirm calls fail safely without duplicating tx hash storage or chat timeline messages.
- The full flow stays on Celo Sepolia only.
