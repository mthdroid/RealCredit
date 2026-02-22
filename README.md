# RealCredit

**RWA Tokenization & Lending Protocol with On-Chain Credit Scoring on Creditcoin**

> Built for the [BUIDL CTC Hackathon](https://dorahacks.io/hackathon/buidl-ctc/) on Creditcoin Testnet

**[Live Demo](https://frontend-beryl-nine-96.vercel.app)** | **[Contracts on Blockscout](https://creditcoin-testnet.blockscout.com/address/0x2Ae27E8065A88dB85e2357a64f4ED72018053e34)**

---

## What is RealCredit?

RealCredit bridges real-world assets into DeFi lending. It lets users:

1. **Tokenize** real-world assets (invoices, treasury bills, real estate) as ERC-721 NFTs with on-chain metadata
2. **Borrow** CTC against verified RWA collateral at credit-score-based interest rates
3. **Lend** CTC into asset-specific pools to earn yield from borrower interest
4. **Build** an on-chain credit score (300-850) based on repayment history — like FICO, but verifiable and portable

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js 14)                     │
│  Dashboard │ Lend │ Borrow │ Credit Score │ RWA Explorer         │
│  wagmi v2 + RainbowKit + Creditcoin Testnet                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │ JSON-RPC
┌──────────────────────────┴──────────────────────────────────────┐
│                  Creditcoin Testnet (Chain ID 102031)             │
│                                                                   │
│  ┌─────────────────────┐    ┌─────────────────────────────────┐  │
│  │ RealCreditFactory   │───>│ Deploys & manages all contracts │  │
│  └──────┬──────┬───────┘    └─────────────────────────────────┘  │
│         │      │                                                  │
│  ┌──────▼──┐ ┌─▼────────────┐  ┌────────────────────────┐       │
│  │RWAToken │ │ LendingPool  │──│ CreditScore            │       │
│  │(ERC-721)│ │ (per asset)  │  │ (shared, 300-850)      │       │
│  │         │ │              │  │                        │       │
│  │ Invoice │ │ deposit()    │  │ recordRepayment()      │       │
│  │ T-Bill  │ │ borrow()     │  │ recordDefault()        │       │
│  │ Real Est│ │ repay()      │  │ getScore() / getRating │       │
│  └─────────┘ │ liquidate()  │  └────────────────────────┘       │
│              └──────────────┘                                    │
└──────────────────────────────────────────────────────────────────┘
```

## Smart Contracts

| Contract | Address | Description |
|----------|---------|-------------|
| **RealCreditFactory** | [`0x2Ae2...053e34`](https://creditcoin-testnet.blockscout.com/address/0x2Ae27E8065A88dB85e2357a64f4ED72018053e34) | Deploys and manages all RWA collections + lending pools |
| **CreditScore** | [`0x7795...0779`](https://creditcoin-testnet.blockscout.com/address/0x77952dc664F9F122261a3d1834B97edccfcACc3F) | On-chain credit scoring (300-850) |
| **Invoice Token** (rcINV) | [`0x357B...d424B8A`](https://creditcoin-testnet.blockscout.com/address/0x357BdCE06ECCac960e4a26AeF54f699AFD424B8A) | ERC-721 for invoice-backed assets |
| **T-Bill Token** (rcTBILL) | [`0xedc5...f3008`](https://creditcoin-testnet.blockscout.com/address/0xedc553D0Aa9B9A06a16c4c7bA3972FC15CdF3008) | ERC-721 for treasury bill assets |
| **Real Estate Token** (rcRE) | [`0x3C83...9b0Fad4`](https://creditcoin-testnet.blockscout.com/address/0x3C83ACAFD1bc820eFf440DEaEA7CA04499b0Fad4) | ERC-721 for real estate assets |
| **Invoice Pool** | [`0xF1b2...345C5`](https://creditcoin-testnet.blockscout.com/address/0xF1b293E69CFBB2236F2125545CA2eFD2486345C5) | Lending pool for invoice collateral |
| **T-Bill Pool** | [`0x201b...0Fad4`](https://creditcoin-testnet.blockscout.com/address/0x201bc3251A857dCc251A9faE7c8abDf4B0c15065) | Lending pool for T-Bill collateral |
| **Real Estate Pool** | [`0xB6f7...5e64`](https://creditcoin-testnet.blockscout.com/address/0xB6f7F9Be0653eed735A6EDc20c0B21Cd1E2F5e64) | Lending pool for real estate collateral |

All contracts deployed and verified on **Creditcoin Testnet** (Chain ID: 102031).

## Credit Scoring Algorithm

RealCredit implements a transparent, on-chain credit scoring system inspired by FICO:

```
Score = clamp(Base + RepaymentBonus - DefaultPenalty + VolumeBonus, 300, 850)

Where:
  Base            = 500
  RepaymentBonus  = min(onTimeRepayments * 50, 300)    // +50 per on-time repay, max 300
  DefaultPenalty  = defaults * 100                       // -100 per default
  VolumeBonus     = totalBorrowed > 10 tCTC ? 25 : 0   // +25 for active borrowers
```

| Score Range | Rating | Interest Rate |
|-------------|--------|---------------|
| 800+ | Excellent | 5% |
| 650-799 | Good | 7.5% |
| 500-649 | Fair | 10% |
| < 500 | High Risk | 15% |

## Key Features

- **70% LTV** — borrow up to 70% of RWA face value
- **Simple interest** — principal * rate * time / year (no compounding)
- **7-day grace period** — before liquidation is allowed on overdue loans
- **Share-based pool accounting** — lenders earn pro-rata interest (ERC-4626-like)
- **Factory pattern** — deploy new asset classes + pools permissionlessly
- **Verified on Blockscout** — fully transparent, auditable smart contracts

## Screenshots

### Dashboard
![Dashboard](https://via.placeholder.com/800x450/030712/60a5fa?text=Dashboard+—+TVL,+Pools,+Credit+Score)

### Credit Score
![Credit Score](https://via.placeholder.com/800x450/030712/4ade80?text=Credit+Score+—+SVG+Gauge+%2B+Breakdown)

### Borrow
![Borrow](https://via.placeholder.com/800x450/030712/c084fc?text=Borrow+—+Mint+RWA,+Borrow+CTC,+Repay)

> Replace these placeholders with actual screenshots from the live demo.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.26, Foundry, OpenZeppelin v5 |
| Frontend | Next.js 14, TypeScript, TailwindCSS |
| Web3 | wagmi v2, viem v2, RainbowKit |
| Chain | Creditcoin Testnet (EVM, Chain ID 102031) |
| Deployment | Vercel (frontend), forge create (contracts) |
| Block Explorer | Blockscout |

## Run Locally

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) (forge, cast)
- Node.js 18+
- A wallet with tCTC (testnet tokens)

### Smart Contracts

```bash
# Clone
git clone https://github.com/mthdroid/RealCredit.git
cd RealCredit

# Install dependencies
forge install

# Build
forge build

# Run tests (45 tests)
forge test -vv
```

### Frontend

```bash
cd frontend

# Install
npm install

# Dev server
npm run dev
# Open http://localhost:3000

# Production build
npm run build
```

### Network Config (MetaMask)

| Field | Value |
|-------|-------|
| Network Name | Creditcoin Testnet |
| RPC URL | `https://rpc.cc3-testnet.creditcoin.network` |
| Chain ID | `102031` |
| Currency | tCTC |
| Explorer | `https://creditcoin-testnet.blockscout.com` |

## Project Structure

```
RealCredit/
├── src/
│   ├── RWAToken.sol          # ERC-721 with RWA metadata
│   ├── CreditScore.sol       # On-chain credit scoring
│   ├── LendingPool.sol       # Borrow/lend against RWA collateral
│   └── RealCreditFactory.sol # Factory for deploying collections + pools
├── test/
│   └── RealCredit.t.sol      # 45 comprehensive tests
├── script/
│   ├── Deploy.s.sol          # Deployment script
│   └── demo-data.sh          # Testnet demo data (mint, verify, borrow, repay)
├── frontend/
│   └── src/
│       ├── app/              # Next.js pages (dashboard, lend, borrow, credit, explorer)
│       ├── components/       # Navbar, Footer, Skeleton, Toast, Modal
│       ├── hooks/            # usePoolData, useCreditScore
│       ├── config/           # ABIs, contracts, chains, wagmi config
│       └── providers/        # Web3Provider (wagmi + RainbowKit)
└── deployments.md            # All contract addresses
```

## Why Creditcoin?

Creditcoin is an **RWA-native Layer 1** blockchain purpose-built for credit and lending. RealCredit is a natural fit because:

- **CEIP alignment** — Creditcoin's core mission is bringing real-world credit on-chain. RealCredit implements exactly this: RWA tokenization + credit scoring + lending
- **EVM compatible** — Full Solidity + Foundry development experience
- **Built for credit** — The chain's identity is credit infrastructure, making our on-chain credit score a native primitive rather than an afterthought

## Roadmap

- [x] Smart contracts (RWAToken, CreditScore, LendingPool, Factory)
- [x] 45 tests covering full lifecycle
- [x] Deploy + verify on Creditcoin Testnet
- [x] Demo data on testnet (5 RWAs, 3 loans, 2 repaid)
- [x] Frontend with 5 pages
- [x] UI polish (skeletons, toasts, modals, responsive)
- [x] Deploy to Vercel
- [ ] Governance token for pool parameter voting
- [ ] Multi-oracle price feeds for RWA valuation
- [ ] Cross-chain credit score portability
- [ ] Insurance fund for lender protection

## License

MIT

---

Built with Foundry + Next.js on Creditcoin Testnet for the BUIDL CTC Hackathon.
