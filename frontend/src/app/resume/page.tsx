import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "mthdroid — Resume",
  description: "Full-stack blockchain developer. Solidity, Foundry, React/Next.js.",
};

export default function ResumePage() {
  return (
    <div className="resume-page">
      {/* Header */}
      <header className="resume-header">
        <h1>mthdroid</h1>
        <div className="handle">Full-Stack Blockchain Developer</div>
        <p className="bio">
          Solidity &amp; full-stack developer focused on DeFi, RWA tokenization, and on-chain credit infrastructure.
          End-to-end builder: smart contracts, testing, frontend, deployment, and protocol design.
        </p>
        <div className="resume-links">
          <a href="https://github.com/mthdroid" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://frontend-beryl-nine-96.vercel.app" target="_blank" rel="noopener noreferrer">Portfolio</a>
        </div>
      </header>

      {/* Skills */}
      <section className="resume-section">
        <h2>Technical Skills</h2>
        <div className="skills-grid">
          <div className="skill-category">
            <h3>Smart Contracts</h3>
            <div className="skill-tags">
              <span className="skill-tag">Solidity</span>
              <span className="skill-tag">Foundry</span>
              <span className="skill-tag">Hardhat</span>
              <span className="skill-tag">OpenZeppelin</span>
              <span className="skill-tag">ERC-721</span>
              <span className="skill-tag">ERC-4626</span>
            </div>
          </div>
          <div className="skill-category">
            <h3>Frontend</h3>
            <div className="skill-tags">
              <span className="skill-tag">React</span>
              <span className="skill-tag">Next.js</span>
              <span className="skill-tag">TypeScript</span>
              <span className="skill-tag">TailwindCSS</span>
              <span className="skill-tag">wagmi</span>
              <span className="skill-tag">viem</span>
            </div>
          </div>
          <div className="skill-category">
            <h3>Blockchain &amp; Web3</h3>
            <div className="skill-tags">
              <span className="skill-tag">EVM</span>
              <span className="skill-tag">DeFi</span>
              <span className="skill-tag">RWA</span>
              <span className="skill-tag">RainbowKit</span>
              <span className="skill-tag">Ethers.js</span>
              <span className="skill-tag">IPFS</span>
            </div>
          </div>
          <div className="skill-category">
            <h3>DevOps &amp; Tools</h3>
            <div className="skill-tags">
              <span className="skill-tag">Git</span>
              <span className="skill-tag">Vercel</span>
              <span className="skill-tag">Docker</span>
              <span className="skill-tag">CI/CD</span>
              <span className="skill-tag">Blockscout</span>
              <span className="skill-tag">Linux</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Project */}
      <section className="resume-section">
        <h2>Featured Project</h2>
        <div className="project-card">
          <h3>RealCredit</h3>
          <div className="project-sub">RWA Tokenization &amp; Lending Protocol with On-Chain Credit Scoring &mdash; BUIDL CTC Hackathon</div>
          <p>
            Complete DeFi protocol on Creditcoin Testnet. Users tokenize real-world assets (invoices, treasury bills, real estate)
            as ERC-721 NFTs, borrow CTC at credit-score-based interest rates, and build a portable on-chain reputation (300-850 FICO-like score).
          </p>
          <ul style={{ paddingLeft: 20, fontSize: 14, color: "#cbd5e1", marginBottom: 12 }}>
            <li>4 smart contracts &mdash; RWAToken, CreditScore, LendingPool, Factory</li>
            <li>45 unit tests covering full loan lifecycle + edge cases</li>
            <li>7-page Next.js frontend with skeleton loading, toasts, modals</li>
            <li>Deployed &amp; verified on Creditcoin Testnet (8 contracts)</li>
            <li>10 RWAs minted, 7 loans, 3 credit profiles with varied scores</li>
          </ul>
          <div className="project-tech">
            <span>Solidity 0.8.26</span>
            <span>Foundry</span>
            <span>OpenZeppelin v5</span>
            <span>Next.js 14</span>
            <span>TypeScript</span>
            <span>wagmi v2</span>
            <span>TailwindCSS</span>
            <span>RainbowKit</span>
            <span>Vercel</span>
          </div>
        </div>
      </section>

      {/* Experience */}
      <section className="resume-section">
        <h2>Approach</h2>
        <div className="exp-item">
          <h3>End-to-End Protocol Builder</h3>
          <div className="exp-meta">Smart Contracts &rarr; Testing &rarr; Deployment &rarr; Verification &rarr; Frontend &rarr; Production</div>
          <ul>
            <li>Design and implement production-grade Solidity contracts with comprehensive test suites</li>
            <li>Build responsive, accessible frontends that integrate seamlessly with on-chain state</li>
            <li>Deploy, verify, and populate testnet environments with realistic demo data</li>
            <li>Focus on DeFi primitives: lending pools, share-based accounting, credit scoring, liquidation</li>
          </ul>
        </div>
      </section>

      {/* Education / Interests */}
      <section className="resume-section">
        <h2>Interests &amp; Focus Areas</h2>
        <div className="skills-grid">
          <div className="skill-category">
            <h3>DeFi</h3>
            <div className="skill-tags">
              <span className="skill-tag">Lending Protocols</span>
              <span className="skill-tag">Yield Farming</span>
              <span className="skill-tag">AMMs</span>
              <span className="skill-tag">Liquidation</span>
            </div>
          </div>
          <div className="skill-category">
            <h3>Real-World Assets</h3>
            <div className="skill-tags">
              <span className="skill-tag">Tokenization</span>
              <span className="skill-tag">Credit Scoring</span>
              <span className="skill-tag">Invoice Factoring</span>
              <span className="skill-tag">T-Bills</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
