import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Web3Provider } from "@/providers/Web3Provider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "RealCredit | RWA Lending on Creditcoin",
  description:
    "Tokenize real-world assets, borrow against them, and build an on-chain credit score on Creditcoin Testnet.",
  keywords: ["RWA", "DeFi", "Creditcoin", "Lending", "Credit Score", "NFT", "Collateral"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-[#030712] text-white min-h-screen`}
        style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}
      >
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
