import { useReadContract, useReadContracts } from "wagmi";
import { formatEther } from "viem";
import { LendingPoolABI, RWATokenABI } from "@/config/abis";
import { POOLS } from "@/config/contracts";

export interface PoolData {
  name: string;
  poolAddress: `0x${string}`;
  tokenAddress: `0x${string}`;
  tokenSymbol: string;
  assetType: string;
  totalDeposited: bigint;
  totalBorrowed: bigint;
  totalShares: bigint;
  utilization: bigint;
  apy: bigint;
  totalLoans: bigint;
  totalMinted: bigint;
  formattedDeposited: string;
  formattedBorrowed: string;
}

export function useAllPoolsData() {
  const contracts = POOLS.flatMap((pool) => [
    {
      address: pool.poolAddress as `0x${string}`,
      abi: LendingPoolABI,
      functionName: "totalDeposited",
    },
    {
      address: pool.poolAddress as `0x${string}`,
      abi: LendingPoolABI,
      functionName: "totalBorrowed",
    },
    {
      address: pool.poolAddress as `0x${string}`,
      abi: LendingPoolABI,
      functionName: "totalShares",
    },
    {
      address: pool.poolAddress as `0x${string}`,
      abi: LendingPoolABI,
      functionName: "getUtilization",
    },
    {
      address: pool.poolAddress as `0x${string}`,
      abi: LendingPoolABI,
      functionName: "getPoolAPY",
    },
    {
      address: pool.poolAddress as `0x${string}`,
      abi: LendingPoolABI,
      functionName: "totalLoans",
    },
    {
      address: pool.tokenAddress as `0x${string}`,
      abi: RWATokenABI,
      functionName: "totalMinted",
    },
  ]);

  const { data, isLoading, refetch } = useReadContracts({
    contracts,
  });

  const pools: PoolData[] = POOLS.map((pool, i) => {
    const offset = i * 7;
    const totalDeposited = (data?.[offset]?.result as bigint) ?? 0n;
    const totalBorrowed = (data?.[offset + 1]?.result as bigint) ?? 0n;
    const totalShares = (data?.[offset + 2]?.result as bigint) ?? 0n;
    const utilization = (data?.[offset + 3]?.result as bigint) ?? 0n;
    const apy = (data?.[offset + 4]?.result as bigint) ?? 0n;
    const totalLoans = (data?.[offset + 5]?.result as bigint) ?? 0n;
    const totalMinted = (data?.[offset + 6]?.result as bigint) ?? 0n;

    return {
      name: pool.name,
      poolAddress: pool.poolAddress as `0x${string}`,
      tokenAddress: pool.tokenAddress as `0x${string}`,
      tokenSymbol: pool.tokenSymbol,
      assetType: pool.assetType,
      totalDeposited,
      totalBorrowed,
      totalShares,
      utilization,
      apy,
      totalLoans,
      totalMinted,
      formattedDeposited: Number(formatEther(totalDeposited)).toFixed(2),
      formattedBorrowed: Number(formatEther(totalBorrowed)).toFixed(2),
    };
  });

  const tvl = pools.reduce((sum, p) => sum + p.totalDeposited, 0n);
  const totalBorrowed = pools.reduce((sum, p) => sum + p.totalBorrowed, 0n);
  const totalLoans = pools.reduce((sum, p) => sum + p.totalLoans, 0n);
  const totalRWAs = pools.reduce((sum, p) => sum + p.totalMinted, 0n);

  return {
    pools,
    tvl,
    totalBorrowed,
    totalLoans,
    totalRWAs,
    isLoading,
    refetch,
  };
}

export function usePoolShares(
  poolAddress: `0x${string}`,
  account: `0x${string}` | undefined
) {
  return useReadContract({
    address: poolAddress,
    abi: LendingPoolABI,
    functionName: "shares",
    args: account ? [account] : undefined,
    query: { enabled: !!account },
  });
}

export function useShareValue(
  poolAddress: `0x${string}`,
  shares: bigint | undefined
) {
  return useReadContract({
    address: poolAddress,
    abi: LendingPoolABI,
    functionName: "getShareValue",
    args: shares !== undefined ? [shares] : undefined,
    query: { enabled: shares !== undefined && shares > 0n },
  });
}
