# SafeDeal Phase 1 Setup Guide

## Step 1: Installation & Setup Commands

Run these in order in terminal at `c:\Users\Hp\Documents\SafeDeal`:

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
copy .env.local.example .env.local

# 3. Start development server
npm run dev

# 4. Verify build (optional)
npm run build

# 5. Type check (optional)
npm run type-check
```

After running, dev server runs at **http://localhost:3000**

## Step 2: Folder Structure

```
SafeDeal/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout, metadata
│   │   ├── page.tsx                   # Login screen (home page)
│   │   ├── globals.css                # Tailwind base styles
│   │   └── inbox/
│   │       └── page.tsx               # Post-login inbox page
│   │
│   ├── components/
│   │   ├── auth/
│   │   │   └── LoginButton.tsx        # Login button with MiniPay call
│   │   └── ui/
│   │       └── button.tsx             # Shadcn button component
│   │
│   ├── lib/
│   │   ├── wallet/
│   │   │   ├── miniPay.ts             # MiniPay detection + viem client
│   │   │   └── storage.ts             # localStorage for wallet state
│   │   ├── constants/
│   │   │   └── network.ts             # Celo Sepolia + USDC constants
│   │   ├── utils.ts                   # cn() for Tailwind merge
│   │   └── types/
│   │       └── window.d.ts            # Types for ethereum window object
│   │
│   └── types/ → see lib/types/
│
├── public/                             # Static assets (empty for now)
├── package.json                        # Dependencies & scripts
├── tsconfig.json                       # TypeScript strict config
├── next.config.js                      # Next.js config
├── tailwind.config.ts                  # Tailwind CSS theme
├── postcss.config.js                   # PostCSS plugins
├── .env.local.example                  # Environment template
├── .gitignore                          # Git ignore rules
└── README.md                           # Project docs
```

## Step 3: Environment Variables

Create `.env.local` with these values:

```env
# Celo Network Configuration
NEXT_PUBLIC_NETWORK_ID=44787
NEXT_PUBLIC_NETWORK_NAME=Celo Sepolia
NEXT_PUBLIC_RPC_URL=https://sepolia-forno.celo-testnet.org

# USDC Token (Celo Sepolia)
NEXT_PUBLIC_USDC_ADDRESS=0x2A3684e9Dc3A8DFF868Bc06Aa9C3Ae20397Aa94
NEXT_PUBLIC_USDC_DECIMALS=6

# App Metadata
NEXT_PUBLIC_APP_NAME=SafeDeal
NEXT_PUBLIC_APP_URL=http://localhost:3000

# For ngrok testing (replace with your ngrok URL)
# NEXT_PUBLIC_APP_URL=https://your-ngrok-hash.ngrok.io
```

## Step 4: MiniPay Wallet Detection Code

Located in `src/lib/wallet/miniPay.ts`:

**Key Functions:**
- `isMiniPayAvailable()` - Check if `window.ethereum` exists
- `getMiniPayProvider()` - Get injected provider
- `requestMiniPayAccount()` - Trigger `eth_requestAccounts` popup
- `getMiniPayAccount()` - Get currently connected account
- `isConnectedToCeloSepolia()` - Verify chain ID is correct
- `createCeloPublicClient()` - viem client for reads

**Flow:**
```
MiniPay detected (window.ethereum)
    ↓
User clicks "Connect with MiniPay"
    ↓
requestMiniPayAccount() triggers wallet popup
    ↓
User approves connection
    ↓
Account returned to frontend
    ↓
Saved to localStorage via saveWallet()
    ↓
Redirect to /inbox
```

## Step 5: Login Screen Code

Located in `src/app/page.tsx`:

**Features:**
- Checks if already logged in on mount
- Shows loading state while checking MiniPay availability
- "Connect with MiniPay" button
- Network validation (must be Celo Sepolia)
- Error handling with user feedback
- Redirects to /inbox on success
- Styled with Tailwind + shadcn/ui

**Component Tree:**
```
page.tsx (LoginPage)
├── useEffect (auth check)
├── useRouter (for navigation)
├── div.flex (center container)
│   ├── div (header: logo + description)
│   ├── div.card (login card)
│   │   ├── h2 (Welcome header)
│   │   ├── div (Celo Sepolia badge)
│   │   └── LoginButton component
│   │       └── Button (Connect with MiniPay)
│   └── div (footer: phase info)
```

## Step 4: Run Instructions

### Local Development (No Tunnel)

```bash
# Terminal 1: Start dev server
npm run dev

# Output should show:
# ▲ Next.js 15.0.0
# - ready - started server on 0.0.0.0:3000, url: http://localhost:3000

# Test in browser or MiniPay app
# Open: http://localhost:3000
```

### Testing with MiniPay Locally

1. Install MiniPay mobile app (iOS/Android)
2. Open MiniPay in-app browser
3. Navigate to http://localhost:3000
4. Click "Connect with MiniPay"
5. Approve wallet connection
6. See connected address on /inbox

⚠️ **Note:** Only works if MiniPay and dev server on same network

### Testing with ngrok (Public Tunnel)

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Start ngrok tunnel
ngrok http 3000

# Output shows:
# Forwarding                    https://abc123.ngrok.io -> http://localhost:3000

# Terminal 3: Update env file
# Edit .env.local:
# NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io

# Terminal 1: Restart Next.js (Ctrl+C then npm run dev)

# In MiniPay:
# Open https://abc123.ngrok.io
# Click "Connect with MiniPay"
# Test the full flow
```

### Production Build Test

```bash
npm run build
npm run start

# Server runs at http://localhost:3000 (production mode)
```

## Test Checklist

- [ ] MiniPay detects correctly (shows "Connect" vs "Checking MiniPay...")
- [ ] Clicking connect triggers MiniPay popup
- [ ] Approving shows connected address
- [ ] Redirects to /inbox with account displayed
- [ ] Refreshing /inbox keeps account (localStorage persists)
- [ ] Clicking disconnect clears account
- [ ] Redirecting to / after disconnect shows login screen
- [ ] Network validation catches non-Sepolia chains
- [ ] All TypeScript errors clear (`npm run type-check`)

## Key Design Decisions

1. **viem only** - No wagmi wrapper, direct wallet calls for simplicity
2. **No Supabase yet** - State lives in localStorage + MiniPay
3. **Public env vars** - All vars prefixed `NEXT_PUBLIC_` for client access
4. **Simple routing** - `/` for login, `/inbox` for authenticated
5. **Minimal UI** - Focused on wallet + navigation, no chat/deals yet
6. **TypeScript strict** - Full type safety, no `any` in core code
7. **Tailwind only** - No external CSS libraries

## Next Phase (Phase 2)

What will be added:
- Supabase tables (users, chats, deals)
- Deal creation UI
- Message history
- Payment contract integration
- Seller/buyer flows

Not in Phase 1:
- Chat features
- Contract deployment
- Payment submission
- Deal review screens
- Notifications
