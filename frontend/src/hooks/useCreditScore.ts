import { useReadContracts } from "wagmi";
import { CreditScoreABI } from "@/config/abis";
import { CONTRACTS } from "@/config/contracts";

function safeBigInt(val: unknown): bigint {
  if (typeof val === "bigint") return val;
  if (val === undefined || val === null) return 0n;
  try { return BigInt(val as string | number); } catch { return 0n; }
}

export interface CreditProfile {
  totalLoans: bigint;
  onTimeRepayments: bigint;
  defaults: bigint;
  totalBorrowed: bigint;
  totalRepaid: bigint;
  lastUpdated: bigint;
}

export function useCreditScore(address: `0x${string}` | undefined) {
  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      {
        address: CONTRACTS.creditScore as `0x${string}`,
        abi: CreditScoreABI,
        functionName: "getScore",
        args: address ? [address] : undefined,
      },
      {
        address: CONTRACTS.creditScore as `0x${string}`,
        abi: CreditScoreABI,
        functionName: "getRating",
        args: address ? [address] : undefined,
      },
      {
        address: CONTRACTS.creditScore as `0x${string}`,
        abi: CreditScoreABI,
        functionName: "getProfile",
        args: address ? [address] : undefined,
      },
    ],
    query: { enabled: !!address },
  });

  const score = safeBigInt(data?.[0]?.result);
  const rating = (data?.[1]?.result as string) ?? "N/A";
  const profileRaw = data?.[2]?.result as
    | readonly unknown[]
    | undefined;

  const profile: CreditProfile = {
    totalLoans: safeBigInt(profileRaw?.[0]),
    onTimeRepayments: safeBigInt(profileRaw?.[1]),
    defaults: safeBigInt(profileRaw?.[2]),
    totalBorrowed: safeBigInt(profileRaw?.[3]),
    totalRepaid: safeBigInt(profileRaw?.[4]),
    lastUpdated: safeBigInt(profileRaw?.[5]),
  };

  return { score, rating, profile, isLoading, refetch };
}
