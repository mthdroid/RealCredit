# CONTEXT — Read This First

I am a solo developer on a 12-day hackathon deadline. You are my technical co-pilot. Your job is to **build a working, deployable product** — not a concept, not a mockup. Be direct, no fluff. Prioritize speed. When blocked, propose 2 alternatives and a recommendation. Don't ask for confirmation on obvious decisions — just do it. Fix bugs, don't explain theory.

## My Tech Stack
- **Strong:** Next.js/React, TypeScript, Solidity/Foundry, ethers.js/viem/wagmi
- **Intermediate:** Rust, Cairo, Python
- **Learning (need heavy AI help):** Nothing — Creditcoin is standard EVM

## Rules
- Working demo > ambitious concept. A polished MVP beats an unfinished grand vision.
- Deploy on Creditcoin testnet (Chain ID 102031), have real transactions, show contract addresses on Blockscout.
- This project aligns with Creditcoin's CORE MISSION: real-world credit, verifiable on-chain. Emphasize this in every aspect.
- If something doesn't work after 30 min of debugging, simplify rather than staying stuck.
- README and video demo matter as much as code — we'll do those on the last 2 days.
- We also need a project deck/whitepaper as PDF.
- IMPORTANT: There are only 3 winners OVERALL (not per track). Quality > quantity. This project must showcase deep ecosystem understanding.

---

# PROJECT — RealCredit: RWA Tokenization & Lending with On-Chain Credit Scores

## Concept
RealCredit is an RWA tokenization and lending protocol on Creditcoin. Issuers tokenize real-world assets (invoices, treasury bills, real estate) as ERC-721 NFTs with verifiable metadata. These RWA-NFTs serve as collateral in a lending pool where lenders deposit CTC to earn yield. The protocol computes an on-chain credit score based on repayment history — directly embodying Creditcoin's core mission of building verifiable credit infrastructure.

## Hackathon: BUIDL CTC Hackathon
- **Prize:** $15,000 (3 winners: $10K + $3K + $2K) + CEIP Investment Fast-Track
- **Deadline:** March 7, 2026
- **Judging:** 100% judge panel (no community votes)
- **Track:** RWA (weight 3/10 — Creditcoin's core narrative)

## MANDATORY Requirements
- [ ] GitHub Repository with README
- [ ] Project Deck/Whitepaper (PDF URL)
- [ ] Demo Video URL
- [ ] Deployed on Creditcoin testnet
- [ ] Original work created during hackathon
- [ ] Team info submitted

---

## Stack Technique

| Component | Tech |
|-----------|------|
| Smart Contracts | Solidity 0.8.x (Foundry) |
| Token Standards | ERC-721 (RWA NFTs) + ERC-20 (pool shares) |
| Frontend | Next.js 14 + TypeScript + TailwindCSS |
| Wallet | wagmi v2 + RainbowKit |
| Chain | Creditcoin Testnet (Chain ID: 102031) |
| RPC | https://rpc.cc3-testnet.creditcoin.network |
| Explorer | https://creditcoin-testnet.blockscout.com/ |
| Gas Token | tCTC (18 decimals) |

---

## Architecture

### Smart Contracts

**RWAToken.sol** (ERC-721) — tokenizes a real-world asset:
- mint(to, metadata) → tokenId. Metadata includes: assetType (invoice/treasury_bill/real_estate), faceValue (USD), maturityDate, issuer name, documentHash (IPFS)
- verify(tokenId) → admin marks as verified
- burn(tokenId) → when asset expires/is repaid

**LendingPool.sol** — lending pool backed by RWA collateral:
- Lender side: deposit(amount) → pool shares, withdraw(shares) → CTC + interest
- Borrower side: borrow(rwaTokenId, amount) → CTC loan (max 70% LTV of faceValue)
- repay(loanId, amount) → repay loan, updates credit score on-time
- liquidate(loanId) → if overdue, transfer RWA NFT to pool
- Interest rate: base 5% + risk premium based on borrower's credit score

**CreditScore.sol** — on-chain credit scoring:
- getScore(address) → 0-1000 score (like FICO)
- Algorithm: base 500, +50 per on-time repayment (max +300), -100 per default, bonus for larger amounts
- Range: 300-850
- Updated automatically by LendingPool on repay/default

**RealCreditFactory.sol** — factory to create RWA collections + pools:
- createRWAToken(name, symbol) → new RWA collection
- createLendingPool(rwaToken) → new pool for that asset type
- getAllPools() → for frontend listing

### Frontend (5 pages)
1. **Dashboard** — TVL, active loans, pool APY, platform stats
2. **Lend** — deposit CTC into pools, see APY, withdraw with interest
3. **Borrow** — tokenize RWA (mint NFT form), use as collateral, borrow CTC
4. **Credit Score** — view on-chain credit score (visual gauge), repayment history
5. **RWA Explorer** — browse all tokenized assets, their status (active/repaid/defaulted)

---

## Timeline (12 days)
- Days 1-2: Setup + all smart contracts (RWAToken, LendingPool, CreditScore, Factory) + tests
- Days 3-4: Deploy on CTC testnet + create demo RWA tokens + run lending cycles + frontend scaffold
- Days 5-7: Complete frontend (5 pages, credit score gauge, RWA explorer)
- Days 8-9: README + project deck PDF
- Days 10-11: Demo video + final polish + populate testnet with rich tx history
- Day 12: SUBMIT

---

## Key Infra

| Item | Value |
|------|-------|
| Testnet RPC | https://rpc.cc3-testnet.creditcoin.network |
| Chain ID | 102031 |
| Explorer | https://creditcoin-testnet.blockscout.com/ |
| Faucet | https://docs.creditcoin.org/wallets/using-testnet-faucet |
| Gas Token | tCTC |

---

## Risks & Fallbacks

| If this happens | Do this |
|----------------|---------|
| Lending pool too complex (interest accrual, liquidation) | Use fixed interest rate (no variable), manual liquidation trigger |
| Credit score not impressive enough | Add a visual gauge/meter component (0-1000 with color gradient) |
| Not enough demo transactions | Write a Foundry script to batch: mint 5 RWAs → 3 borrow cycles → 2 repayments → 1 default |
| Time crunch (this is SECONDARY project, 40% time) | Reuse CreditVault frontend boilerplate (same stack, same UI components) |
| LTV calculation edge cases | Keep it simple: LTV = borrowed / faceValue, reject if > 70%, no oracle needed |
| RWA metadata storage | Store on-chain in struct (not IPFS) — simpler and verifiable on explorer |

---

# INSTRUCTION

Start by initializing the Foundry project. Create `RWAToken.sol` as an ERC-721 with a `RWAMetadata` struct stored per tokenId. Then create `CreditScore.sol` with the scoring algorithm. Then create `LendingPool.sol` that integrates both (borrow against RWA collateral, repay updates credit score). Finally `RealCreditFactory.sol`. Write comprehensive tests covering the full lifecycle: mint RWA → deposit CTC → borrow → repay → check score update. Also test the liquidation path.
