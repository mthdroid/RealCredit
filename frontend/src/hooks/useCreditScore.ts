import { useReadContracts } from "wagmi";
import { CreditScoreABI } from "@/config/abis";
import { CONTRACTS } from "@/config/contracts";

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

  const score = (data?.[0]?.result as bigint) ?? 0n;
  const rating = (data?.[1]?.result as string) ?? "N/A";
  const profileRaw = data?.[2]?.result as
    | [bigint, bigint, bigint, bigint, bigint, bigint]
    | undefined;

  const profile: CreditProfile = {
    totalLoans: profileRaw?.[0] ?? 0n,
    onTimeRepayments: profileRaw?.[1] ?? 0n,
    defaults: profileRaw?.[2] ?? 0n,
    totalBorrowed: profileRaw?.[3] ?? 0n,
    totalRepaid: profileRaw?.[4] ?? 0n,
    lastUpdated: profileRaw?.[5] ?? 0n,
  };

  return { score, rating, profile, isLoading, refetch };
}
