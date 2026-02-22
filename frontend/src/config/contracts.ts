import {
  RealCreditFactoryABI,
  CreditScoreABI,
  RWATokenABI,
  LendingPoolABI,
} from "./abis";

// Deployed contract addresses on Creditcoin Testnet
export const CONTRACTS = {
  factory: "0x2Ae27E8065A88dB85e2357a64f4ED72018053e34",
  creditScore: "0x77952dc664F9F122261a3d1834B97edccfcACc3F",
  invoiceToken: "0x357BdCE06ECCac960e4a26AeF54f699AFD424B8A",
  tbillToken: "0xedc553D0Aa9B9A06a16c4c7bA3972FC15CdF3008",
  realEstateToken: "0x3C83ACAFD1bc820eFf440DEaEA7CA04499b0Fad4",
  invoicePool: "0xF1b293E69CFBB2236F2125545CA2eFD2486345C5",
  tbillPool: "0x201bc3251A857dCc251A9faE7c8abDf4B0c15065",
  realEstatePool: "0xB6f7F9Be0653eed735A6EDc20c0B21Cd1E2F5e64",
} as const;

// Pool configs for UI iteration
export const POOLS = [
  {
    name: "Invoice Pool",
    tokenAddress: CONTRACTS.invoiceToken,
    poolAddress: CONTRACTS.invoicePool,
    tokenName: "RealCredit Invoices",
    tokenSymbol: "rcINV",
    assetType: "INVOICE" as const,
  },
  {
    name: "T-Bill Pool",
    tokenAddress: CONTRACTS.tbillToken,
    poolAddress: CONTRACTS.tbillPool,
    tokenName: "RealCredit T-Bills",
    tokenSymbol: "rcTBILL",
    assetType: "TREASURY_BILL" as const,
  },
  {
    name: "Real Estate Pool",
    tokenAddress: CONTRACTS.realEstateToken,
    poolAddress: CONTRACTS.realEstatePool,
    tokenName: "RealCredit Real Estate",
    tokenSymbol: "rcRE",
    assetType: "REAL_ESTATE" as const,
  },
] as const;

// ABI exports for wagmi hooks
export const ABIS = {
  factory: RealCreditFactoryABI,
  creditScore: CreditScoreABI,
  rwaToken: RWATokenABI,
  lendingPool: LendingPoolABI,
} as const;
