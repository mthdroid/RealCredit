"use client";

import { CONTRACTS } from "@/config/contracts";

export function Footer() {
  return (
    <footer className="border-t border-gray-800 mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center font-bold text-[9px]">
              RC
            </div>
            <span>RealCredit — RWA Lending on Creditcoin</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={`https://creditcoin-testnet.blockscout.com/address/${CONTRACTS.factory}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-300 transition"
            >
              Contracts
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-300 transition"
            >
              GitHub
            </a>
            <span>Built for BUIDL CTC Hackathon</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
