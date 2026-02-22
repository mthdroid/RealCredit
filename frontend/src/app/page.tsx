"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StatCardSkeleton, TableRowSkeleton } from "@/components/Skeleton";
import { useAllPoolsData } from "@/hooks/usePoolData";
import { useCreditScore } from "@/hooks/useCreditScore";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import Link from "next/link";

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${accent || "text-white"}`}>{value}</p>
    </div>
  );
}

function PoolRow({
  name,
  deposited,
  borrowed,
  utilization,
  loans,
  rwas,
  poolAddress,
}: {
  name: string;
  deposited: string;
  borrowed: string;
  utilization: string;
  loans: string;
  rwas: string;
  poolAddress: string;
}) {
  return (
    <tr className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
      <td className="py-4 px-4 font-medium">{name}</td>
      <td className="py-4 px-4 text-right tabular-nums">{deposited} tCTC</td>
      <td className="py-4 px-4 text-right tabular-nums">{borrowed} tCTC</td>
      <td className="py-4 px-4 text-right tabular-nums">{utilization}%</td>
      <td className="py-4 px-4 text-right tabular-nums hidden sm:table-cell">{loans}</td>
      <td className="py-4 px-4 text-right tabular-nums hidden sm:table-cell">{rwas}</td>
      <td className="py-4 px-4 text-right">
        <a
          href={`https://creditcoin-testnet.blockscout.com/address/${poolAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 text-sm transition"
        >
          View
        </a>
      </td>
    </tr>
  );
}

export default function Dashboard() {
  const { address } = useAccount();
  const { pools, tvl, totalBorrowed, totalLoans, totalRWAs, isLoading } =
    useAllPoolsData();
  const { score, rating } = useCreditScore(address);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
          <p className="text-gray-500 text-sm">Protocol overview and your positions</p>
        </div>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Value Locked" value={`${Number(formatEther(tvl)).toFixed(2)} tCTC`} />
            <StatCard label="Total Borrowed" value={`${Number(formatEther(totalBorrowed)).toFixed(2)} tCTC`} />
            <StatCard label="Active Loans" value={totalLoans.toString()} />
            <StatCard label="RWAs Tokenized" value={totalRWAs.toString()} />
          </div>
        )}

        {/* Credit Score Banner */}
        {address && (
          <Link
            href="/credit"
            className="block bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-800/40 rounded-xl p-6 mb-8 hover:border-blue-600/60 hover:shadow-lg hover:shadow-blue-900/20 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Your On-Chain Credit Score</p>
                <p className="text-4xl font-bold text-blue-400 tabular-nums">{score.toString()}</p>
              </div>
              <div className="text-right">
                <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${
                  rating === "Excellent" ? "bg-green-900/50 text-green-400"
                    : rating === "Good" ? "bg-blue-900/50 text-blue-400"
                    : rating === "Fair" ? "bg-yellow-900/50 text-yellow-400"
                    : "bg-red-900/50 text-red-400"
                }`}>
                  {rating}
                </span>
                <p className="text-xs text-gray-500 mt-2">View details &rarr;</p>
              </div>
            </div>
          </Link>
        )}

        {/* Pool Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Lending Pools</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-dot" />
              <span className="text-xs text-gray-500">Live</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-800">
                  <th className="py-3 px-4 font-medium text-xs uppercase tracking-wider">Pool</th>
                  <th className="py-3 px-4 text-right font-medium text-xs uppercase tracking-wider">Deposited</th>
                  <th className="py-3 px-4 text-right font-medium text-xs uppercase tracking-wider">Borrowed</th>
                  <th className="py-3 px-4 text-right font-medium text-xs uppercase tracking-wider">Util.</th>
                  <th className="py-3 px-4 text-right font-medium text-xs uppercase tracking-wider hidden sm:table-cell">Loans</th>
                  <th className="py-3 px-4 text-right font-medium text-xs uppercase tracking-wider hidden sm:table-cell">RWAs</th>
                  <th className="py-3 px-4 text-right font-medium text-xs uppercase tracking-wider w-16"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [1, 2, 3].map((i) => <TableRowSkeleton key={i} />)
                ) : (
                  pools.map((pool) => (
                    <PoolRow
                      key={pool.poolAddress}
                      name={pool.name}
                      deposited={pool.formattedDeposited}
                      borrowed={pool.formattedBorrowed}
                      utilization={(Number(pool.utilization) / 100).toFixed(1)}
                      loans={pool.totalLoans.toString()}
                      rwas={pool.totalMinted.toString()}
                      poolAddress={pool.poolAddress}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          <Link href="/lend" className="group bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-600/50 hover:shadow-lg hover:shadow-blue-900/10 transition-all text-center">
            <div className="w-10 h-10 bg-blue-600/10 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-600/20 transition">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3v14m0-14l4 4m-4-4L6 7" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <p className="text-lg font-semibold mb-1">Earn Yield</p>
            <p className="text-sm text-gray-500">Deposit CTC into pools</p>
          </Link>
          <Link href="/borrow" className="group bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-600/50 hover:shadow-lg hover:shadow-blue-900/10 transition-all text-center">
            <div className="w-10 h-10 bg-green-600/10 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-green-600/20 transition">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 17V3m0 14l4-4m-4 4L6 13" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <p className="text-lg font-semibold mb-1">Get a Loan</p>
            <p className="text-sm text-gray-500">Borrow against RWA collateral</p>
          </Link>
          <Link href="/explorer" className="group bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-600/50 hover:shadow-lg hover:shadow-blue-900/10 transition-all text-center">
            <div className="w-10 h-10 bg-purple-600/10 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-600/20 transition">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="6" stroke="#c084fc" strokeWidth="2"/><path d="M14 14l3 3" stroke="#c084fc" strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
            <p className="text-lg font-semibold mb-1">Explore RWAs</p>
            <p className="text-sm text-gray-500">Browse tokenized assets</p>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
