"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { POOLS } from "@/config/contracts";
import { RWATokenABI, LendingPoolABI } from "@/config/abis";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { useState, useEffect } from "react";

const ASSET_TYPES = [
  { value: 0, label: "Invoice" },
  { value: 1, label: "Treasury Bill" },
  { value: 2, label: "Real Estate" },
];

function MintForm() {
  const { address } = useAccount();
  const { toast } = useToast();
  const [poolIdx, setPoolIdx] = useState(0);
  const [faceValue, setFaceValue] = useState("");
  const [maturityDays, setMaturityDays] = useState("90");
  const [issuerName, setIssuerName] = useState("");

  const pool = POOLS[poolIdx];

  const { writeContract, data: hash, isPending: isMinting } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) toast("RWA token minted successfully!", "success");
  }, [isSuccess, toast]);

  const handleMint = () => {
    if (!faceValue || !issuerName || !maturityDays || !address) return;
    const maturity = BigInt(Math.floor(Date.now() / 1000) + Number(maturityDays) * 86400);
    const docHash = "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;

    writeContract({
      address: pool.tokenAddress as `0x${string}`,
      abi: RWATokenABI,
      functionName: "mint",
      args: [address, poolIdx, parseEther(faceValue), maturity, issuerName, docHash],
    });
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1v14M1 8h14" stroke="#c084fc" strokeWidth="2" strokeLinecap="round"/></svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Tokenize RWA</h2>
          <p className="text-xs text-gray-500">Mint an ERC-721 NFT</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Asset Type</label>
          <select value={poolIdx} onChange={(e) => setPoolIdx(Number(e.target.value))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-600 focus:outline-none transition">
            {ASSET_TYPES.map((t, i) => <option key={t.value} value={i}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Face Value (USD)</label>
          <input type="number" placeholder="e.g. 25000" value={faceValue} onChange={(e) => setFaceValue(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-blue-600 focus:outline-none transition" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Maturity (days)</label>
          <input type="number" placeholder="90" value={maturityDays} onChange={(e) => setMaturityDays(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-blue-600 focus:outline-none transition" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Issuer Name</label>
          <input type="text" placeholder="e.g. Acme Corp" value={issuerName} onChange={(e) => setIssuerName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-blue-600 focus:outline-none transition" />
        </div>

        <div className="p-3 bg-gray-800/50 rounded-lg text-sm space-y-1">
          <p className="text-gray-500">Collection: <span className="text-white">{pool.tokenName}</span></p>
          <p className="text-gray-500">Max Borrow (70% LTV): <span className="text-white">{faceValue ? (Number(faceValue) * 0.7).toLocaleString() : "\u2014"} tCTC</span></p>
        </div>

        <button onClick={handleMint} disabled={isMinting || confirming || !faceValue || !issuerName}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-600 text-white font-medium py-3 rounded-lg transition">
          {isMinting ? "Confirm in wallet..." : confirming ? "Processing..." : "Mint RWA Token"}
        </button>

        <p className="text-xs text-gray-600">
          Minting requires the minter role. An admin must verify the token before it can be used as collateral.
        </p>
      </div>
    </div>
  );
}

function BorrowForm() {
  const { address } = useAccount();
  const { toast } = useToast();
  const [poolIdx, setPoolIdx] = useState(0);
  const [tokenId, setTokenId] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");

  const pool = POOLS[poolIdx];

  const { data: rate } = useReadContract({
    address: pool.poolAddress as `0x${string}`,
    abi: LendingPoolABI,
    functionName: "getBorrowerRate",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { writeContract: approve, data: approveHash, isPending: isApproving } = useWriteContract();
  const { writeContract: borrow, data: borrowHash, isPending: isBorrowing } = useWriteContract();

  const { isLoading: approveConfirming, isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: borrowConfirming, isSuccess: borrowSuccess } = useWaitForTransactionReceipt({ hash: borrowHash });

  useEffect(() => {
    if (approveSuccess) toast("NFT approved for collateral", "success");
  }, [approveSuccess, toast]);
  useEffect(() => {
    if (borrowSuccess) toast("Loan created! Your NFT is held as collateral.", "success");
  }, [borrowSuccess, toast]);

  const handleApprove = () => {
    if (!tokenId) return;
    approve({
      address: pool.tokenAddress as `0x${string}`,
      abi: RWATokenABI,
      functionName: "approve",
      args: [pool.poolAddress as `0x${string}`, BigInt(tokenId)],
    });
  };

  const handleBorrow = () => {
    if (!tokenId || !borrowAmount) return;
    borrow({
      address: pool.poolAddress as `0x${string}`,
      abi: LendingPoolABI,
      functionName: "borrow",
      args: [BigInt(tokenId), parseEther(borrowAmount)],
    });
  };

  const ratePercent = rate ? (Number(rate) / 100).toFixed(1) : "\u2014";

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 13V3m0 10l3-3m-3 3L5 10" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Borrow CTC</h2>
          <p className="text-xs text-gray-500">Lock RWA as collateral</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Pool</label>
          <select value={poolIdx} onChange={(e) => setPoolIdx(Number(e.target.value))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-600 focus:outline-none transition">
            {POOLS.map((p, i) => <option key={p.poolAddress} value={i}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">RWA Token ID</label>
          <input type="number" placeholder="e.g. 1" value={tokenId} onChange={(e) => setTokenId(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-blue-600 focus:outline-none transition" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Borrow Amount (tCTC)</label>
          <input type="number" placeholder="Amount to borrow" value={borrowAmount} onChange={(e) => setBorrowAmount(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-blue-600 focus:outline-none transition" />
        </div>

        <div className="p-3 bg-gray-800/50 rounded-lg text-sm space-y-1">
          <p className="text-gray-500">Interest Rate: <span className="text-white tabular-nums">{ratePercent}%</span></p>
          <p className="text-gray-500">Max LTV: <span className="text-white">70%</span></p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleApprove} disabled={isApproving || approveConfirming || !tokenId}
            className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white font-medium py-3 rounded-lg transition text-sm">
            {isApproving || approveConfirming ? "Approving..." : "1. Approve NFT"}
          </button>
          <button onClick={handleBorrow} disabled={isBorrowing || borrowConfirming || !tokenId || !borrowAmount}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-600 text-white font-medium py-3 rounded-lg transition text-sm">
            {isBorrowing || borrowConfirming ? "Borrowing..." : "2. Borrow CTC"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RepayForm() {
  const { toast } = useToast();
  const [poolIdx, setPoolIdx] = useState(0);
  const [loanId, setLoanId] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const pool = POOLS[poolIdx];

  const { data: amountOwed } = useReadContract({
    address: pool.poolAddress as `0x${string}`,
    abi: LendingPoolABI,
    functionName: "getAmountOwed",
    args: loanId ? [BigInt(loanId)] : undefined,
    query: { enabled: !!loanId },
  });

  const { writeContract: repay, data: repayHash, isPending: isRepaying } = useWriteContract();
  const { isLoading: repayConfirming, isSuccess: repaySuccess } = useWaitForTransactionReceipt({ hash: repayHash });

  useEffect(() => {
    if (repaySuccess) {
      toast("Loan repaid! NFT returned. Credit score updated.", "success");
      setShowConfirm(false);
    }
  }, [repaySuccess, toast]);

  const handleRepay = () => {
    if (!loanId || !amountOwed) return;
    const buffer = (amountOwed as bigint) + parseEther("0.01");
    repay({
      address: pool.poolAddress as `0x${string}`,
      abi: LendingPoolABI,
      functionName: "repay",
      args: [BigInt(loanId)],
      value: buffer,
    });
  };

  const owedBigInt = amountOwed as bigint | undefined;
  const hasDebt = owedBigInt !== undefined && owedBigInt > 0n;

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-emerald-600/20 rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M6 4l-4 4 4 4" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Repay Loan</h2>
            <p className="text-xs text-gray-500">Get your NFT back</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Pool</label>
            <select value={poolIdx} onChange={(e) => setPoolIdx(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-600 focus:outline-none transition">
              {POOLS.map((p, i) => <option key={p.poolAddress} value={i}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Loan ID</label>
            <input type="number" placeholder="e.g. 1" value={loanId} onChange={(e) => setLoanId(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-blue-600 focus:outline-none transition" />
          </div>

          {hasDebt && (
            <div className="p-3 bg-yellow-900/20 border border-yellow-800/30 rounded-lg text-sm">
              <p className="text-gray-500">Amount Owed: <span className="text-yellow-400 font-bold tabular-nums">{Number(formatEther(owedBigInt)).toFixed(6)} tCTC</span></p>
            </div>
          )}

          <button onClick={() => setShowConfirm(true)} disabled={isRepaying || repayConfirming || !hasDebt}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-800 disabled:text-gray-600 text-white font-medium py-3 rounded-lg transition">
            {isRepaying || repayConfirming ? "Processing..." : "Repay Loan"}
          </button>
        </div>
      </div>

      <Modal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirm Repayment"
        onConfirm={handleRepay}
        confirmLabel="Repay Now"
        confirmColor="green"
        loading={isRepaying || repayConfirming}
      >
        <div className="space-y-3 text-sm">
          <p className="text-gray-400">You are about to repay loan #{loanId} in the {pool.name}.</p>
          {hasDebt && (
            <div className="p-3 bg-gray-800 rounded-lg">
              <p className="text-gray-500">Amount: <span className="text-white font-bold tabular-nums">{Number(formatEther(owedBigInt)).toFixed(6)} tCTC</span></p>
              <p className="text-gray-500">+ 0.01 tCTC buffer for accrued interest</p>
            </div>
          )}
          <p className="text-gray-500">Your RWA NFT will be returned and your credit score will be updated.</p>
        </div>
      </Modal>
    </>
  );
}

export default function BorrowPage() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Borrow</h1>
          <p className="text-gray-500 text-sm">Tokenize real-world assets, use them as collateral, and borrow CTC</p>
        </div>

        {!isConnected ? (
          <div className="text-center py-16 text-gray-500 bg-gray-900 border border-gray-800 rounded-xl">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto mb-4 text-gray-600"><rect x="8" y="20" width="32" height="20" rx="4" stroke="currentColor" strokeWidth="2"/><path d="M16 20V14a8 8 0 1116 0v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            <p className="text-lg font-medium mb-1">Connect your wallet</p>
            <p className="text-sm">to start borrowing</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <MintForm />
            <BorrowForm />
            <RepayForm />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
