#!/bin/bash
# RealCredit Demo Data Script — populates testnet with rich tx history
# Uses cast send (forge script doesn't work on CTC testnet due to prevrandao)

set -e

RPC="https://rpc.cc3-testnet.creditcoin.network"
PK="YOUR_PRIVATE_KEY_HERE"
DEPLOYER=$(cast wallet address --private-key $PK)
FLAGS="--rpc-url $RPC --private-key $PK --legacy"

# Contract addresses
FACTORY="0x2Ae27E8065A88dB85e2357a64f4ED72018053e34"
CREDIT_SCORE="0x77952dc664F9F122261a3d1834B97edccfcACc3F"
INVOICE_TOKEN="0x357BdCE06ECCac960e4a26AeF54f699AFD424B8A"
TBILL_TOKEN="0xedc553D0Aa9B9A06a16c4c7bA3972FC15CdF3008"
RE_TOKEN="0x3C83ACAFD1bc820eFf440DEaEA7CA04499b0Fad4"
INVOICE_POOL="0xF1b293E69CFBB2236F2125545CA2eFD2486345C5"
TBILL_POOL="0x201bc3251A857dCc251A9faE7c8abDf4B0c15065"
RE_POOL="0xB6f7F9Be0653eed735A6EDc20c0B21Cd1E2F5e64"

echo "=== RealCredit Demo Data Script ==="
echo "Deployer: $DEPLOYER"
echo "Balance: $(cast balance $DEPLOYER --rpc-url $RPC -e) tCTC"
echo ""

# ═══════════════════════════════════════════
# STEP 1: Mint 5 RWA Tokens
# ═══════════════════════════════════════════
echo "── Step 1: Minting 5 RWA Tokens ──"

# Maturity dates: 90 days from now
MATURITY_90=$(($(date +%s) + 7776000))
MATURITY_180=$(($(date +%s) + 15552000))
MATURITY_365=$(($(date +%s) + 31536000))
DOC_HASH="0x$(echo -n 'demo-document-hash' | sha256sum | cut -d' ' -f1)"

# Invoice 1: $25,000 face value
echo "  Minting Invoice #1 (25K USD)..."
cast send $INVOICE_TOKEN \
  "mint(address,uint8,uint256,uint256,string,bytes32)(uint256)" \
  $DEPLOYER 0 25000000000000000000000 $MATURITY_90 "Acme Corp" $DOC_HASH \
  $FLAGS > /dev/null 2>&1
echo "  ✓ Invoice #1 minted"

# Invoice 2: $15,000 face value
echo "  Minting Invoice #2 (15K USD)..."
cast send $INVOICE_TOKEN \
  "mint(address,uint8,uint256,uint256,string,bytes32)(uint256)" \
  $DEPLOYER 0 15000000000000000000000 $MATURITY_90 "Beta Industries" $DOC_HASH \
  $FLAGS > /dev/null 2>&1
echo "  ✓ Invoice #2 minted"

# T-Bill 1: $50,000 face value
echo "  Minting T-Bill #1 (50K USD)..."
cast send $TBILL_TOKEN \
  "mint(address,uint8,uint256,uint256,string,bytes32)(uint256)" \
  $DEPLOYER 1 50000000000000000000000 $MATURITY_180 "US Treasury" $DOC_HASH \
  $FLAGS > /dev/null 2>&1
echo "  ✓ T-Bill #1 minted"

# T-Bill 2: $30,000 face value
echo "  Minting T-Bill #2 (30K USD)..."
cast send $TBILL_TOKEN \
  "mint(address,uint8,uint256,uint256,string,bytes32)(uint256)" \
  $DEPLOYER 1 30000000000000000000000 $MATURITY_180 "US Treasury" $DOC_HASH \
  $FLAGS > /dev/null 2>&1
echo "  ✓ T-Bill #2 minted"

# Real Estate 1: $100,000 face value
echo "  Minting Real Estate #1 (100K USD)..."
cast send $RE_TOKEN \
  "mint(address,uint8,uint256,uint256,string,bytes32)(uint256)" \
  $DEPLOYER 2 100000000000000000000000 $MATURITY_365 "Downtown Realty LLC" $DOC_HASH \
  $FLAGS > /dev/null 2>&1
echo "  ✓ Real Estate #1 minted"

echo ""

# ═══════════════════════════════════════════
# STEP 2: Verify all RWA tokens
# ═══════════════════════════════════════════
echo "── Step 2: Verifying all RWA Tokens ──"

for i in 1 2; do
  echo "  Verifying Invoice #$i..."
  cast send $INVOICE_TOKEN "verify(uint256)" $i $FLAGS > /dev/null 2>&1
  echo "  ✓ Invoice #$i verified"
done

for i in 1 2; do
  echo "  Verifying T-Bill #$i..."
  cast send $TBILL_TOKEN "verify(uint256)" $i $FLAGS > /dev/null 2>&1
  echo "  ✓ T-Bill #$i verified"
done

echo "  Verifying Real Estate #1..."
cast send $RE_TOKEN "verify(uint256)" 1 $FLAGS > /dev/null 2>&1
echo "  ✓ Real Estate #1 verified"

echo ""

# ═══════════════════════════════════════════
# STEP 3: Deposit CTC as lender into pools
# ═══════════════════════════════════════════
echo "── Step 3: Depositing CTC into lending pools ──"

echo "  Depositing 100 tCTC into Invoice Pool..."
cast send $INVOICE_POOL "deposit()" --value 100ether $FLAGS > /dev/null 2>&1
echo "  ✓ 100 tCTC deposited into Invoice Pool"

echo "  Depositing 200 tCTC into T-Bill Pool..."
cast send $TBILL_POOL "deposit()" --value 200ether $FLAGS > /dev/null 2>&1
echo "  ✓ 200 tCTC deposited into T-Bill Pool"

echo "  Depositing 300 tCTC into Real Estate Pool..."
cast send $RE_POOL "deposit()" --value 300ether $FLAGS > /dev/null 2>&1
echo "  ✓ 300 tCTC deposited into Real Estate Pool"

echo ""

# ═══════════════════════════════════════════
# STEP 4: Borrow against RWA collateral (3 loans)
# ═══════════════════════════════════════════
echo "── Step 4: Borrowing against RWA collateral ──"

# Loan 1: Borrow 15 tCTC against Invoice #1 (25K face, 70% LTV = 17.5K max)
echo "  Approving Invoice #1 for Invoice Pool..."
cast send $INVOICE_TOKEN "approve(address,uint256)" $INVOICE_POOL 1 $FLAGS > /dev/null 2>&1
echo "  Borrowing 15 tCTC against Invoice #1..."
cast send $INVOICE_POOL "borrow(uint256,uint256)" 1 15000000000000000000 $FLAGS > /dev/null 2>&1
echo "  ✓ Loan 1: 15 tCTC borrowed against Invoice #1"

# Loan 2: Borrow 30 tCTC against T-Bill #1 (50K face, 70% LTV = 35K max)
echo "  Approving T-Bill #1 for T-Bill Pool..."
cast send $TBILL_TOKEN "approve(address,uint256)" $TBILL_POOL 1 $FLAGS > /dev/null 2>&1
echo "  Borrowing 30 tCTC against T-Bill #1..."
cast send $TBILL_POOL "borrow(uint256,uint256)" 1 30000000000000000000 $FLAGS > /dev/null 2>&1
echo "  ✓ Loan 2: 30 tCTC borrowed against T-Bill #1"

# Loan 3: Borrow 50 tCTC against Real Estate #1 (100K face, 70% LTV = 70K max)
echo "  Approving Real Estate #1 for RE Pool..."
cast send $RE_TOKEN "approve(address,uint256)" $RE_POOL 1 $FLAGS > /dev/null 2>&1
echo "  Borrowing 50 tCTC against Real Estate #1..."
cast send $RE_POOL "borrow(uint256,uint256)" 1 50000000000000000000 $FLAGS > /dev/null 2>&1
echo "  ✓ Loan 3: 50 tCTC borrowed against Real Estate #1"

echo ""

# ═══════════════════════════════════════════
# STEP 5: Repay 2 loans on time
# ═══════════════════════════════════════════
echo "── Step 5: Repaying 2 loans on time ──"

# Repay Loan 1 (Invoice Pool, loan ID 1) — send 0.1 tCTC buffer over principal
echo "  Repaying Loan 1 (Invoice, ~15.1 tCTC with buffer)..."
cast send $INVOICE_POOL "repay(uint256)" 1 --value 15100000000000000000 $FLAGS > /dev/null 2>&1
echo "  ✓ Loan 1 repaid on time — credit score improved!"

# Repay Loan 2 (T-Bill Pool, loan ID 1) — send 0.1 tCTC buffer over principal
echo "  Repaying Loan 2 (T-Bill, ~30.1 tCTC with buffer)..."
cast send $TBILL_POOL "repay(uint256)" 1 --value 30100000000000000000 $FLAGS > /dev/null 2>&1
echo "  ✓ Loan 2 repaid on time — credit score improved again!"

echo ""

# ═══════════════════════════════════════════
# STEP 6: Check credit score
# ═══════════════════════════════════════════
echo "── Step 6: Credit Score Check ──"

SCORE=$(cast call $CREDIT_SCORE "getScore(address)(uint256)" $DEPLOYER --rpc-url $RPC)
RATING=$(cast call $CREDIT_SCORE "getRating(address)(string)" $DEPLOYER --rpc-url $RPC)
echo "  Credit Score: $SCORE"
echo "  Rating: $RATING"

echo ""

# ═══════════════════════════════════════════
# STEP 7: Summary
# ═══════════════════════════════════════════
echo "=== DEMO DATA COMPLETE ==="
echo ""
echo "Created:"
echo "  • 5 RWA tokens (2 invoices, 2 t-bills, 1 real estate)"
echo "  • 5 verified assets"
echo "  • 600 tCTC deposited across 3 pools"
echo "  • 3 loans created"
echo "  • 2 loans repaid on time"
echo "  • 1 loan still active (Real Estate — can be liquidated after maturity)"
echo "  • Credit score updated with repayment history"
echo ""
echo "Loan 3 (RE Pool, ID 1) is ACTIVE — will become liquidatable after maturity + 7 days"
echo ""
echo "Final balance: $(cast balance $DEPLOYER --rpc-url $RPC -e) tCTC"
