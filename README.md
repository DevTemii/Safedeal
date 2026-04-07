# SafeDeal Phase 1

Production-ready MiniPay mini app scaffold for Celo.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local

# Run development server
npm run dev
```

Open `http://localhost:3000` in browser or MiniPay.

## Phase 1 Scope

✅ MiniPay wallet detection  
✅ Login screen with Celo Sepolia  
✅ Account connection flow  
✅ Session persistence  

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_NETWORK_ID` - Chain ID (44787 for Celo Sepolia)
- `NEXT_PUBLIC_RPC_URL` - RPC endpoint
- `NEXT_PUBLIC_USDC_ADDRESS` - USDC token address
- `NEXT_PUBLIC_ESCROW_ADDRESS` - SafeDeal escrow contract address on the active chain
- `NEXT_PUBLIC_APP_URL` - App root URL

SafeDeal stays on Celo Sepolia by default until mainnet launch is explicitly configured.

## Testing with MiniPay

### Local Development
```bash
npm run dev
# Open http://localhost:3000 in MiniPay
```

### With ngrok (public tunnel)
```bash
# Terminal 1: Start development server
npm run dev

# Terminal 2: Create ngrok tunnel
ngrok http 3000

# Update .env.local
NEXT_PUBLIC_APP_URL=https://your-ngrok-url.ngrok.io

# Use https://your-ngrok-url.ngrok.io in MiniPay
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Login page
│   ├── globals.css          # Tailwind styles
│   └── inbox/
│       └── page.tsx         # Inbox page (after login)
├── components/
│   ├── auth/
│   │   └── LoginButton.tsx  # Login button component
│   └── ui/
│       └── button.tsx       # Button component
├── lib/
│   ├── wallet/
│   │   ├── miniPay.ts       # MiniPay wallet detection & RPC
│   │   └── storage.ts       # Local storage utilities
│   ├── constants/
│   │   └── network.ts       # Network constants
│   ├── utils.ts             # Utility functions
│   └── types/
│       └── window.d.ts      # TypeScript type declarations
└── types/
    └── window.d.ts
```

## Next Steps (Phase 2)

- [ ] Supabase setup for chat messages
- [ ] Payment escrow contract
- [ ] Deal creation flow
- [ ] Secure payment submission

## Stack

- Next.js 15 App Router
- TypeScript
- viem (wallet interaction)
- Tailwind CSS
- shadcn/ui components
- MiniPay injected wallet
- Celo Sepolia testnet

## Environment

- Chain: Celo Sepolia (ID: 44787)
- Token: USDC (Testnet)
- RPC: https://sepolia-forno.celo-testnet.org
- Escrow: set `NEXT_PUBLIC_ESCROW_ADDRESS` after Sepolia deployment
