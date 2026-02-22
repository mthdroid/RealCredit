import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RealCredit — Project Deck",
  description: "RWA Tokenization & Lending Protocol with On-Chain Credit Scoring on Creditcoin",
};

const contracts = [
  { name: "Factory", address: "0x2Ae2...053e34" },
  { name: "CreditScore", address: "0x7795...cACc3F" },
  { name: "Invoice Token", address: "0x357B...24B8A" },
  { name: "T-Bill Token", address: "0xedc5...f3008" },
  { name: "Real Estate Token", address: "0x3C83...b0Fad4" },
  { name: "Invoice Pool", address: "0xF1b2...345C5" },
  { name: "T-Bill Pool", address: "0x201b...15065" },
  { name: "Real Estate Pool", address: "0xB6f7...5e64" },
];

export default function DeckPage() {
  return (
    <div className="deck-page">
      {/* SLIDE 1: Title */}
      <section className="slide">
        <div className="logo-mark">
          <div className="icon">RC</div>
          <span>RealCredit</span>
        </div>
        <h1>RWA Tokenization &amp; Lending<br />with On-Chain Credit Scoring</h1>
        <p className="subtitle">Bringing real-world asset lending and verifiable credit history to Creditcoin</p>
        <div className="tag-row">
          <span className="tag tag-blue">BUIDL CTC Hackathon</span>
          <span className="tag tag-cyan">Creditcoin Testnet</span>
          <span className="tag tag-green">Live Demo</span>
        </div>
        <div className="slide-number">1 / 8</div>
      </section>

      {/* SLIDE 2: Problem */}
      <section className="slide">
        <h2>The Problem</h2>
        <div className="grid-2">
          <div>
            <ul className="bullet-list">
              <li><strong>Opaque credit systems</strong> &mdash; Traditional credit scores are proprietary black boxes controlled by three US agencies</li>
              <li><strong>No on-chain verification</strong> &mdash; DeFi has no way to assess borrower reliability; everyone pays the same rate</li>
              <li className="amber"><strong>RWAs are stranded</strong> &mdash; $100T+ in real-world assets can&apos;t be used as DeFi collateral</li>
              <li className="purple"><strong>Undercollateralized lending is broken</strong> &mdash; Without reputation, DeFi requires 150%+ overcollateralization</li>
            </ul>
          </div>
          <div className="card flex-center">
            <div className="stat">
              <div className="number red">$100T+</div>
              <div className="label">Real-world assets locked out of DeFi</div>
            </div>
            <div style={{ height: 24 }} />
            <div className="stat">
              <div className="number amber">0</div>
              <div className="label">On-chain credit reputation systems in production</div>
            </div>
          </div>
        </div>
        <div className="slide-number">2 / 8</div>
      </section>

      {/* SLIDE 3: Solution */}
      <section className="slide">
        <h2>Our Solution</h2>
        <p className="subtitle">A complete on-chain lending protocol with RWA collateral and reputation-based rates</p>
        <div className="grid-3">
          <div className="card">
            <h3 className="blue">Tokenize</h3>
            <p className="card-text">Mint ERC-721 NFTs representing invoices, T-bills, and real estate with on-chain metadata. Verified by admins before use as collateral.</p>
          </div>
          <div className="card">
            <h3 className="green">Lend &amp; Borrow</h3>
            <p className="card-text">Lenders deposit CTC into asset-specific pools. Borrowers lock verified RWA-NFTs as collateral and borrow at 70% LTV with credit-based rates.</p>
          </div>
          <div className="card">
            <h3 className="purple">Credit Score</h3>
            <p className="card-text">Every repayment and default is recorded on-chain. Scores range 300-850 (FICO-like) and directly determine interest rates: 5% to 15%.</p>
          </div>
        </div>
        <div style={{ height: 28 }} />
        <div className="flow">
          <div className="flow-step">Mint RWA<br /><small>ERC-721</small></div>
          <div className="flow-arrow">&rarr;</div>
          <div className="flow-step">Verify<br /><small>Admin</small></div>
          <div className="flow-arrow">&rarr;</div>
          <div className="flow-step">Deposit CTC<br /><small>Lenders</small></div>
          <div className="flow-arrow">&rarr;</div>
          <div className="flow-step">Borrow<br /><small>70% LTV</small></div>
          <div className="flow-arrow">&rarr;</div>
          <div className="flow-step">Repay<br /><small>+50 score</small></div>
        </div>
        <div className="slide-number">3 / 8</div>
      </section>

      {/* SLIDE 4: Architecture */}
      <section className="slide">
        <h2>Architecture</h2>
        <div className="grid-2">
          <div>
            <h3 className="blue">Smart Contracts (Solidity 0.8.26)</h3>
            <ul className="bullet-list">
              <li><strong>RealCreditFactory</strong> &mdash; Deploys RWA collections + lending pools</li>
              <li className="green"><strong>RWAToken (ERC-721)</strong> &mdash; On-chain metadata: asset type, face value, maturity, issuer</li>
              <li className="purple"><strong>LendingPool</strong> &mdash; Share-based deposits, credit-scored borrowing, liquidation</li>
              <li className="amber"><strong>CreditScore</strong> &mdash; Autonomous scoring: base 500, +50/repay, -100/default</li>
            </ul>
            <div style={{ height: 16 }} />
            <h3 className="blue">Frontend (Next.js 14)</h3>
            <ul className="bullet-list">
              <li>5 pages: Dashboard, Lend, Borrow, Credit Score, RWA Explorer</li>
              <li className="green">wagmi v2 + RainbowKit + Creditcoin custom chain</li>
              <li className="purple">Loading skeletons, toast notifications, confirmation modals</li>
            </ul>
          </div>
          <div>
            <table className="contract-table">
              <thead><tr><th>Contract</th><th>Address</th></tr></thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c.name}><td>{c.name}</td><td className="mono">{c.address}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="highlight" style={{ marginTop: 16, textAlign: "center" }}>
              <strong>45 tests</strong> &mdash; Full lifecycle coverage<br />
              <span className="muted-sm">Mint &rarr; Verify &rarr; Deposit &rarr; Borrow &rarr; Repay &rarr; Score Update &rarr; Liquidate</span>
            </div>
          </div>
        </div>
        <div className="slide-number">4 / 8</div>
      </section>

      {/* SLIDE 5: Why Creditcoin */}
      <section className="slide">
        <h2>Why Creditcoin?</h2>
        <p className="subtitle">RealCredit is built for Creditcoin because Creditcoin is built for RealCredit</p>
        <div className="grid-2">
          <div className="card">
            <h3 className="blue">RWA-Native L1</h3>
            <p className="card-text">Creditcoin is the only Layer 1 blockchain purpose-built for real-world credit. Our protocol extends its core mission with tokenized collateral and programmable lending pools.</p>
          </div>
          <div className="card">
            <h3 className="green">CEIP Alignment</h3>
            <p className="card-text">Creditcoin Enhancement Improvement Proposals focus on credit infrastructure. RealCredit implements on-chain credit scoring as a <em>native primitive</em>, not an afterthought.</p>
          </div>
        </div>
        <div style={{ height: 24 }} />
        <div className="highlight">
          <div className="grid-3" style={{ textAlign: "center" }}>
            <div>
              <div className="big-stat blue">EVM</div>
              <div className="muted-sm">Compatible &mdash; Solidity + Foundry</div>
            </div>
            <div>
              <div className="big-stat cyan">102031</div>
              <div className="muted-sm">Testnet Chain ID</div>
            </div>
            <div>
              <div className="big-stat green">Blockscout</div>
              <div className="muted-sm">Full contract verification</div>
            </div>
          </div>
        </div>
        <div className="slide-number">5 / 8</div>
      </section>

      {/* SLIDE 6: Live Demo Data */}
      <section className="slide">
        <h2>Live on Testnet</h2>
        <p className="subtitle">Real transactions, real state, fully verifiable on Blockscout</p>
        <div className="grid-3" style={{ marginBottom: 24 }}>
          <div className="card stat">
            <div className="number blue">10</div>
            <div className="label">RWA Tokens Minted</div>
          </div>
          <div className="card stat">
            <div className="number green">900</div>
            <div className="label">tCTC Total Value Locked</div>
          </div>
          <div className="card stat">
            <div className="number purple">7</div>
            <div className="label">Loans Created</div>
          </div>
        </div>
        <div className="grid-2">
          <div className="card">
            <h3 className="blue">Demo Transactions</h3>
            <ul className="bullet-list small">
              <li>4 invoices &mdash; minted &amp; verified across 3 wallets</li>
              <li className="green">4 treasury bills &mdash; minted &amp; verified</li>
              <li className="amber">2 real estate tokens &mdash; minted &amp; verified</li>
              <li className="purple">6 loans repaid on-time, 1 active (overdue)</li>
            </ul>
          </div>
          <div className="card">
            <h3 className="green">3 Credit Profiles</h3>
            <div className="score-table">
              <div className="score-row">
                <span className="muted">Deployer</span>
                <span><strong>675</strong> &mdash; Good</span>
              </div>
              <div className="score-row">
                <span className="muted">Wallet B (Good)</span>
                <span><strong>675</strong> &mdash; Good</span>
              </div>
              <div className="score-row">
                <span className="muted">Wallet C (Risky)</span>
                <span><strong>500</strong> &mdash; Poor</span>
              </div>
              <div className="score-row divider">
                <span className="muted">Algorithm</span>
                <span>Base 500 + 50/repay - 100/default + 25 volume</span>
              </div>
            </div>
          </div>
        </div>
        <div className="slide-number">6 / 8</div>
      </section>

      {/* SLIDE 7: Roadmap */}
      <section className="slide">
        <h2>Roadmap</h2>
        <div className="grid-2">
          <div>
            <div className="timeline">
              <div className="timeline-item done">
                <div className="time">Completed</div>
                <p><strong>Core Protocol</strong> &mdash; 4 smart contracts, 45 tests, deployed &amp; verified</p>
              </div>
              <div className="timeline-item done">
                <div className="time">Completed</div>
                <p><strong>Frontend</strong> &mdash; 7 polished pages, responsive, deployed to Vercel</p>
              </div>
              <div className="timeline-item done">
                <div className="time">Completed</div>
                <p><strong>Testnet Demo</strong> &mdash; 10 RWAs, 7 loans, 3 credit profiles</p>
              </div>
              <div className="timeline-item">
                <div className="time">Next</div>
                <p><strong>Governance</strong> &mdash; DAO token for pool parameter voting</p>
              </div>
              <div className="timeline-item">
                <div className="time">Future</div>
                <p><strong>Multi-Oracle</strong> &mdash; Chainlink/API3 price feeds for RWA valuation</p>
              </div>
            </div>
          </div>
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 className="blue">Scaling Opportunities</h3>
              <ul className="bullet-list small">
                <li>Cross-chain credit score portability (EAS attestations)</li>
                <li className="green">Insurance fund for lender protection</li>
                <li className="purple">Institutional RWA onboarding pipeline</li>
                <li className="amber">Credit delegation (borrow on someone else&apos;s score)</li>
              </ul>
            </div>
            <div className="highlight" style={{ textAlign: "center" }}>
              <div className="muted-sm">Potential Market Size</div>
              <div className="number blue" style={{ fontSize: 36 }}>$16T</div>
              <div className="muted-sm">RWA tokenization market by 2030 (BCG estimate)</div>
            </div>
          </div>
        </div>
        <div className="slide-number">7 / 8</div>
      </section>

      {/* SLIDE 8: Team + Links */}
      <section className="slide">
        <h2>Team &amp; Links</h2>
        <div className="grid-2">
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 className="blue">Solo Builder</h3>
              <p style={{ fontSize: 15 }}><strong>mthdroid</strong></p>
              <p className="card-text">Full-stack blockchain developer. Solidity, Foundry, React/Next.js. Designed, built, and deployed the entire protocol in under 2 weeks.</p>
            </div>
            <div className="card">
              <h3 className="cyan">Tech Stack</h3>
              <div className="card-text" style={{ lineHeight: 2 }}>
                <strong className="white">Contracts:</strong> Solidity 0.8.26 + Foundry + OpenZeppelin v5<br />
                <strong className="white">Frontend:</strong> Next.js 14 + TypeScript + TailwindCSS<br />
                <strong className="white">Web3:</strong> wagmi v2 + viem v2 + RainbowKit<br />
                <strong className="white">Chain:</strong> Creditcoin Testnet (EVM, ID 102031)
              </div>
            </div>
          </div>
          <div className="link-cards">
            <a href="https://frontend-beryl-nine-96.vercel.app" target="_blank" rel="noopener noreferrer" className="card link-card border-blue">
              <div className="link-icon">&#x1f310;</div>
              <h3 className="blue">Live Demo</h3>
              <p className="muted-sm">frontend-beryl-nine-96.vercel.app</p>
            </a>
            <a href="https://github.com/mthdroid/RealCredit" target="_blank" rel="noopener noreferrer" className="card link-card">
              <div className="link-icon">&#x1f4bb;</div>
              <h3>Source Code</h3>
              <p className="muted-sm">github.com/mthdroid/RealCredit</p>
            </a>
            <a href="https://creditcoin-testnet.blockscout.com/address/0x2Ae27E8065A88dB85e2357a64f4ED72018053e34" target="_blank" rel="noopener noreferrer" className="card link-card">
              <div className="link-icon">&#x1f50d;</div>
              <h3>Verified Contracts</h3>
              <p className="muted-sm">Blockscout Explorer</p>
            </a>
          </div>
        </div>
        <div className="slide-number">8 / 8</div>
      </section>
    </div>
  );
}
