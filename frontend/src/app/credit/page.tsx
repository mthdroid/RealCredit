"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Skeleton } from "@/components/Skeleton";
import { useCreditScore } from "@/hooks/useCreditScore";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { CONTRACTS } from "@/config/contracts";

function ScoreGauge({ score, rating }: { score: number; rating: string }) {
  const min = 300;
  const max = 850;
  const pct = Math.max(0, Math.min(100, ((score - min) / (max - min)) * 100));

  const getColor = () => {
    if (score >= 750) return { ring: "text-green-400", bg: "bg-green-400" };
    if (score >= 650) return { ring: "text-blue-400", bg: "bg-blue-400" };
    if (score >= 550) return { ring: "text-yellow-400", bg: "bg-yellow-400" };
    if (score >= 450) return { ring: "text-orange-400", bg: "bg-orange-400" };
    return { ring: "text-red-400", bg: "bg-red-400" };
  };

  const color = getColor();
  const radius = 120;
  const stroke = 14;
  const circumference = Math.PI * radius;
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-72 h-40">
        <svg viewBox="0 0 260 140" className="w-full h-full" style={{ overflow: "visible" }}>
          <path d="M 10 130 A 120 120 0 0 1 250 130" fill="none" stroke="#1f2937" strokeWidth={stroke} strokeLinecap="round" />
          <path
            d="M 10 130 A 120 120 0 0 1 250 130"
            fill="none"
            stroke="currentColor"
            className={color.ring}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <p className={`text-5xl font-bold tabular-nums ${color.ring}`}>{score}</p>
          <p className="text-gray-500 text-sm mt-1">out of 850</p>
        </div>
      </div>
      <div className="mt-4">
        <span className={`text-xl font-semibold px-4 py-2 rounded-full ${
          rating === "Excellent" ? "bg-green-900/50 text-green-400"
            : rating === "Good" ? "bg-blue-900/50 text-blue-400"
            : rating === "Fair" ? "bg-yellow-900/50 text-yellow-400"
            : rating === "Poor" ? "bg-orange-900/50 text-orange-400"
            : "bg-red-900/50 text-red-400"
        }`}>
          {rating}
        </span>
      </div>
      <div className="flex justify-between w-72 mt-4 text-xs text-gray-600">
        <span>300</span><span>450</span><span>550</span><span>650</span><span>750</span><span>850</span>
      </div>
    </div>
  );
}

function ProfileStats({
  totalLoans, onTimeRepayments, defaults, totalBorrowed, totalRepaid,
}: {
  totalLoans: bigint; onTimeRepayments: bigint; defaults: bigint; totalBorrowed: bigint; totalRepaid: bigint;
}) {
  const stats = [
    { label: "Total Loans", value: totalLoans.toString() },
    { label: "On-Time", value: onTimeRepayments.toString(), color: "text-green-400" },
    { label: "Defaults", value: defaults.toString(), color: "text-red-400" },
    { label: "Borrowed", value: `${Number(formatEther(totalBorrowed)).toFixed(2)}`, sub: "tCTC" },
    { label: "Repaid", value: `${Number(formatEther(totalRepaid)).toFixed(2)}`, sub: "tCTC" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className={`text-2xl font-bold tabular-nums ${s.color || "text-white"}`}>{s.value}</p>
          <p className="text-xs text-gray-500 mt-1">{s.label}{s.sub && ` (${s.sub})`}</p>
        </div>
      ))}
    </div>
  );
}

function ScoreBreakdown({ score, profile }: { score: number; profile: { onTimeRepayments: bigint; defaults: bigint; totalBorrowed: bigint; totalLoans: bigint } }) {
  const base = 500;
  const repayBonus = Math.min(Number(profile.onTimeRepayments) * 50, 300);
  const defaultPenalty = Number(profile.defaults) * 100;
  const volumeBonus = profile.totalBorrowed > 10000000000000000000n ? 25 : 0;

  const items = [
    { label: "Base Score", value: `${base}`, color: "" },
    { label: "Repayment Bonus (+50 each, max 300)", value: `+${repayBonus}`, color: "text-green-400" },
    { label: "Default Penalty (-100 each)", value: defaultPenalty > 0 ? `-${defaultPenalty}` : "0", color: "text-red-400" },
    { label: "Volume Bonus (>10 tCTC)", value: `+${volumeBonus}`, color: "text-blue-400" },
  ];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">Score Breakdown</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">{item.label}</span>
            <span className={`font-mono tabular-nums ${item.color}`}>{item.value}</span>
          </div>
        ))}
        <div className="border-t border-gray-700 pt-3 flex justify-between items-center">
          <span className="font-semibold">Computed Score</span>
          <span className="font-mono font-bold text-lg tabular-nums">{score}</span>
        </div>
        <p className="text-xs text-gray-600">Clamped to range [300, 850]</p>
      </div>
    </div>
  );
}

function InterestRateTable({ score }: { score: number }) {
  const brackets = [
    { range: "800+", rate: "5%", label: "Excellent", check: score >= 800 },
    { range: "650-799", rate: "7.5%", label: "Good", check: score >= 650 && score < 800 },
    { range: "500-649", rate: "10%", label: "Fair", check: score >= 500 && score < 650 },
    { range: "<500", rate: "15%", label: "High Risk", check: score < 500 },
  ];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">Your Interest Rate</h3>
      <div className="space-y-2">
        {brackets.map((b) => (
          <div
            key={b.range}
            className={`flex justify-between items-center p-3 rounded-lg transition ${
              b.check ? "bg-blue-900/30 border border-blue-700" : "bg-gray-800/50"
            }`}
          >
            <div>
              <span className="font-medium">{b.range}</span>
              <span className="text-gray-500 ml-2 text-sm">{b.label}</span>
            </div>
            <span className={`font-mono font-bold tabular-nums ${b.check ? "text-blue-400" : "text-gray-500"}`}>
              {b.rate}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CreditPage() {
  const { address, isConnected } = useAccount();
  const { score, rating, profile, isLoading } = useCreditScore(address);
  const scoreNum = Number(score);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Credit Score</h1>
          <p className="text-gray-500 text-sm">Your on-chain credit score based on repayment history &mdash; like FICO, but verifiable</p>
        </div>

        {!isConnected ? (
          <div className="text-center py-16 text-gray-500 bg-gray-900 border border-gray-800 rounded-xl">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto mb-4 text-gray-600"><circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2"/><path d="M24 14v10l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            <p className="text-lg font-medium mb-1">Connect your wallet</p>
            <p className="text-sm">to view your credit score</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-8">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 flex justify-center">
              <div className="flex flex-col items-center gap-4">
                <Skeleton className="w-72 h-40" />
                <Skeleton className="w-24 h-8 rounded-full" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <Skeleton className="h-8 w-12 mx-auto mb-2" />
                  <Skeleton className="h-3 w-16 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 flex justify-center">
              <ScoreGauge score={scoreNum} rating={rating} />
            </div>
            <ProfileStats
              totalLoans={profile.totalLoans}
              onTimeRepayments={profile.onTimeRepayments}
              defaults={profile.defaults}
              totalBorrowed={profile.totalBorrowed}
              totalRepaid={profile.totalRepaid}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ScoreBreakdown score={scoreNum} profile={profile} />
              <InterestRateTable score={scoreNum} />
            </div>
            <div className="text-center text-sm text-gray-600">
              <a
                href={`https://creditcoin-testnet.blockscout.com/address/${CONTRACTS.creditScore}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition"
              >
                View CreditScore contract on Blockscout &rarr;
              </a>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
