import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { creditcoinTestnet } from "./chains";

export const config = getDefaultConfig({
  appName: "RealCredit",
  projectId: "realcredit-rwa-lending", // WalletConnect project ID placeholder
  chains: [creditcoinTestnet],
  ssr: true,
});
