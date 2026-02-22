"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PoolCardSkeleton } from "@/components/Skeleton";
import { useToast } from "@/components/Toast";
import { useAllPoolsData, usePoolShares, useShareValue } from "@/hooks/usePoolData";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
import { LendingPoolABI } from "@/config/abis";
import { useState, useEffect } from "react";

function PoolCard({
  name,
  poolAddress,
  deposited,
  borrowed,
  utilization,
}: {
  name: string;
  poolAddress: `0x${string}`;
  deposited: string;
  borrowed: string;
  utilization: string;
}) {
  const { address } = useAccount();
  const { toast } = useToast();
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");

  const { data: shares } = usePoolShares(poolAddress, address);
  const { data: shareValue } = useShareValue(poolAddress, shares as bigint | undefined);

  const { writeContract: deposit, data: depositHash, isPending: isDepositing } = useWriteContract();
  const { writeContract: withdraw, data: withdrawHash, isPending: isWithdrawing } = useWriteContract();

  const { isLoading: depositConfirming, isSuccess: depositSuccess } = useWaitForTransactionReceipt({ hash: depositHash });
  const { isLoading: withdrawConfirming, isSuccess: withdrawSuccess } = useWaitForTransactionReceipt({ hash: withdrawHash });

  useEffect(() => {
    if (depositSuccess) toast("Deposit confirmed!", "success");
  }, [depositSuccess, toast]);
  useEffect(() => {
    if (withdrawSuccess) toast("Withdrawal confirmed!", "success");
  }, [withdrawSuccess, toast]);

  const handleDeposit = () => {
    if (!depositAmount || Number(depositAmount) <= 0) return;
    deposit({
      address: poolAddress,
      abi: LendingPoolABI,
      functionName: "deposit",
      value: parseEther(depositAmount),
    });
    setDepositAmount("");
  };

  const handleWithdraw = () => {
    if (!withdrawAmount || Number(withdrawAmount) <= 0) return;
    withdraw({
      address: poolAddress,
      abi: LendingPoolABI,
      functionName: "withdraw",
      args: [parseEther(withdrawAmount)],
    });
    setWithdrawAmount("");
  };

  const userShares = shares as bigint | undefined;
  const userValue = shareValue as bigint | undefined;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition">
      <div className="p-6 border-b border-gray-800">
        <h3 className="text-lg font-semibold mb-4">{name}</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Deposited</p>
            <p className="text-lg font-bold tabular-nums mt-0.5">{deposited} tCTC</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Borrowed</p>
            <p className="text-lg font-bold tabular-nums mt-0.5">{borrowed} tCTC</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Utilization</p>
            <p className="text-lg font-bold tabular-nums mt-0.5">{utilization}%</p>
          </div>
        </div>
        {address && userShares !== undefined && userShares > 0n && (
          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800/30 rounded-lg">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Your Position</p>
            <p className="text-lg font-bold text-blue-400 tabular-nums">
              {Number(formatEther(userValue ?? 0n)).toFixed(4)} tCTC
            </p>
            <p className="text-xs text-gray-500">
              {Number(formatEther(userShares)).toFixed(4)} shares
            </p>
          </div>
        )}
      </div>

      {address && (
        <div className="p-6">
          <div className="flex gap-1 mb-4 bg-gray-800/50 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("deposit")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
                activeTab === "deposit" ? "bg-blue-600 text-white shadow" : "text-gray-400 hover:text-white"
              }`}
            >
              Deposit
            </button>
            <button
              onClick={() => setActiveTab("withdraw")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
                activeTab === "withdraw" ? "bg-blue-600 text-white shadow" : "text-gray-400 hover:text-white"
              }`}
            >
              Withdraw
            </button>
          </div>

          {activeTab === "deposit" ? (
            <div className="space-y-3">
              <input
                type="number"
                placeholder="Amount in tCTC"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-600 focus:outline-none transition"
              />
              <button
                onClick={handleDeposit}
                disabled={isDepositing || depositConfirming || !depositAmount}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-600 text-white font-medium py-3 rounded-lg transition"
              >
                {isDepositing ? "Confirm in wallet..." : depositConfirming ? "Processing..." : "Deposit tCTC"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="number"
                placeholder="Shares to withdraw"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-600 focus:outline-none transition"
              />
              <button
                onClick={handleWithdraw}
                disabled={isWithdrawing || withdrawConfirming || !withdrawAmount}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-600 text-white font-medium py-3 rounded-lg transition"
              >
                {isWithdrawing ? "Confirm in wallet..." : withdrawConfirming ? "Processing..." : "Withdraw"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function LendPage() {
  const { pools, isLoading } = useAllPoolsData();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Lend</h1>
          <p className="text-gray-500 text-sm">Deposit CTC into lending pools to earn yield from borrower interest</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <PoolCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pools.map((pool) => (
              <PoolCard
                key={pool.poolAddress}
                name={pool.name}
                poolAddress={pool.poolAddress}
                deposited={pool.formattedDeposited}
                borrowed={pool.formattedBorrowed}
                utilization={(Number(pool.utilization) / 100).toFixed(1)}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
