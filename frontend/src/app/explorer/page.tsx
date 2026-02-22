"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StatCardSkeleton, AssetCardSkeleton } from "@/components/Skeleton";
import { POOLS } from "@/config/contracts";
import { RWATokenABI } from "@/config/abis";
import { useReadContracts } from "wagmi";
import { formatEther } from "viem";

function safeBigInt(val: unknown): bigint {
  if (typeof val === "bigint") return val;
  if (val === undefined || val === null) return 0n;
  try { return BigInt(val as string | number); } catch { return 0n; }
}

const ASSET_TYPE_LABELS = ["Invoice", "Treasury Bill", "Real Estate"];
const ASSET_TYPE_COLORS = [
  "bg-blue-900/30 text-blue-400",
  "bg-purple-900/30 text-purple-400",
  "bg-amber-900/30 text-amber-400",
];

interface RWAAsset {
  collection: string;
  tokenAddress: string;
  tokenId: number;
  assetType: number;
  faceValue: bigint;
  maturityDate: bigint;
  issuerName: string;
  verified: boolean;
  active: boolean;
  owner: string;
}

function useAllRWAs() {
  const mintedContracts = POOLS.map((pool) => ({
    address: pool.tokenAddress as `0x${string}`,
    abi: RWATokenABI,
    functionName: "totalMinted" as const,
  }));

  const { data: mintedData, isLoading: loadingCounts } = useReadContracts({ contracts: mintedContracts });

  const detailContracts: {
    address: `0x${string}`;
    abi: typeof RWATokenABI;
    functionName: string;
    args?: readonly unknown[];
  }[] = [];
  const tokenMap: { poolIdx: number; tokenId: number }[] = [];

  if (mintedData) {
    POOLS.forEach((pool, poolIdx) => {
      const minted = Number(mintedData[poolIdx]?.result ?? 0n);
      for (let id = 1; id <= minted; id++) {
        detailContracts.push({ address: pool.tokenAddress as `0x${string}`, abi: RWATokenABI, functionName: "getMetadata", args: [BigInt(id)] });
        detailContracts.push({ address: pool.tokenAddress as `0x${string}`, abi: RWATokenABI, functionName: "ownerOf", args: [BigInt(id)] });
        tokenMap.push({ poolIdx, tokenId: id });
      }
    });
  }

  const { data: detailData, isLoading: loadingDetails } = useReadContracts({
    contracts: detailContracts,
    query: { enabled: detailContracts.length > 0 },
  });

  const assets: RWAAsset[] = [];
  if (detailData) {
    tokenMap.forEach(({ poolIdx, tokenId }, i) => {
      const meta = detailData[i * 2]?.result as [number, bigint, bigint, string, string, boolean, boolean] | undefined;
      const owner = detailData[i * 2 + 1]?.result as string | undefined;
      if (meta) {
        assets.push({
          collection: POOLS[poolIdx].name,
          tokenAddress: POOLS[poolIdx].tokenAddress,
          tokenId,
          assetType: Number(meta[0]),
          faceValue: safeBigInt(meta[1]),
          maturityDate: safeBigInt(meta[2]),
          issuerName: String(meta[3] ?? ""),
          verified: Boolean(meta[5]),
          active: Boolean(meta[6]),
          owner: owner ?? "Unknown",
        });
      }
    });
  }

  return { assets, isLoading: loadingCounts || loadingDetails };
}

function StatusBadge({ verified, active }: { verified: boolean; active: boolean }) {
  if (!verified) {
    return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-400">Unverified</span>;
  }
  if (active) {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-400 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-dot" />
        Active
      </span>
    );
  }
  return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-900/50 text-yellow-400">Used</span>;
}

function AssetCard({ asset }: { asset: RWAAsset }) {
  const maturityDate = new Date(Number(asset.maturityDate) * 1000);
  const isExpired = maturityDate < new Date();
  const faceValueFormatted = Number(formatEther(asset.faceValue)).toLocaleString();

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 hover:shadow-lg hover:shadow-black/20 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${ASSET_TYPE_COLORS[asset.assetType] || "bg-gray-800 text-gray-400"}`}>
              {ASSET_TYPE_LABELS[asset.assetType] ?? "Unknown"}
            </span>
            <span className="text-xs text-gray-600">#{asset.tokenId}</span>
          </div>
          <p className="text-sm text-gray-500">{asset.collection}</p>
        </div>
        <StatusBadge verified={asset.verified} active={asset.active} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div>
          <p className="text-xs text-gray-600">Face Value</p>
          <p className="font-bold tabular-nums">{faceValueFormatted} tCTC</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Issuer</p>
          <p className="font-medium truncate">{asset.issuerName}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Maturity</p>
          <p className={`font-medium ${isExpired ? "text-red-400" : ""}`}>
            {maturityDate.toLocaleDateString()}
            {isExpired && " (exp.)"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Owner</p>
          <p className="font-mono text-xs truncate text-gray-400" title={asset.owner}>
            {asset.owner.slice(0, 6)}...{asset.owner.slice(-4)}
          </p>
        </div>
      </div>

      <a
        href={`https://creditcoin-testnet.blockscout.com/token/${asset.tokenAddress}/instance/${asset.tokenId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300 text-xs transition"
      >
        View on Blockscout &rarr;
      </a>
    </div>
  );
}

export default function ExplorerPage() {
  const { assets, isLoading } = useAllRWAs();

  const totalAssets = assets.length;
  const verified = assets.filter((a) => a.verified).length;
  const active = assets.filter((a) => a.active).length;
  const totalFaceValue = assets.reduce((sum, a) => sum + a.faceValue, 0n);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">RWA Explorer</h1>
          <p className="text-gray-500 text-sm">Browse all tokenized real-world assets across lending pools</p>
        </div>

        {isLoading ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => <AssetCardSkeleton key={i} />)}
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold tabular-nums">{totalAssets}</p>
                <p className="text-xs text-gray-500 mt-1">Total RWAs</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-400 tabular-nums">{verified}</p>
                <p className="text-xs text-gray-500 mt-1">Verified</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-blue-400 tabular-nums">{active}</p>
                <p className="text-xs text-gray-500 mt-1">Active</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold tabular-nums">{Number(formatEther(totalFaceValue)).toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Face Value (tCTC)</p>
              </div>
            </div>

            {assets.length === 0 ? (
              <div className="text-center py-16 text-gray-500 bg-gray-900 border border-gray-800 rounded-xl">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto mb-4 text-gray-600"><rect x="8" y="8" width="32" height="32" rx="8" stroke="currentColor" strokeWidth="2"/><path d="M18 24h12M24 18v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                <p className="text-lg font-medium mb-1">No RWA tokens yet</p>
                <p className="text-sm">Mint your first token on the Borrow page</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assets.map((asset) => (
                  <AssetCard key={`${asset.tokenAddress}-${asset.tokenId}`} asset={asset} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
