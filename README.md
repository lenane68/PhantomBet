# PhantomBet

A privacy-first decentralized prediction market with AI-powered settlement using Chainlink Runtime Environment (CRE).

> **Bet in the shadows. Settle with truth.**

## 🚀 Features

- **Privacy-Preserving Betting**: Commitment-reveal scheme keeps bets private during betting phase
- **AI-Powered Settlement**: Automated outcome verification using GPT-4 and multiple data sources
- **Multi-Source Verification**: Cross-references news APIs, sports data, and social media
- **Cross-Chain Ready**: Built on Arbitrum with CRE orchestration
- **Institutional Grade**: Compliance-friendly privacy with transparent settlement

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
│  Market Creation | Betting Interface | Settlement Dashboard  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Smart Contracts (Solidity)                 │
│  PredictionMarket.sol | CRESettlementOracle.sol             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Chainlink Runtime Environment (CRE)             │
│                   Settlement Workflow                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  News API    │  │ SportsData   │  │  OpenAI GPT-4│      │
│  │  Integration │  │  Integration │  │  Analysis    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
chainlink-prediction-market/
├── contracts/              # Smart contracts (Hardhat)
│   ├── src/
│   │   ├── PredictionMarket.sol
│   │   └── CRESettlementOracle.sol
│   ├── test/
│   └── scripts/
├── cre-workflow/          # Chainlink CRE workflow
│   ├── src/
│   │   └── settlement-workflow.ts
│   └── config/
│       └── cre.config.json
├── frontend/              # React frontend
│   └── src/
│       ├── components/
│       ├── hooks/
│       └── utils/
└── docs/                  # Documentation
```

## 🛠️ Technology Stack

- **Smart Contracts**: Solidity 0.8.x, Hardhat
- **Blockchain**: Arbitrum Sepolia (testnet)
- **CRE**: Chainlink Runtime Environment
- **AI**: OpenAI GPT-4o-MINI
- **Frontend**: React, Vite, ethers.js
- **Data Sources**: News API, SportsData.io

## 📋 Prerequisites

- Node.js >= 18
- npm or yarn
- Chainlink CRE CLI
- Wallet with Arbitrum Sepolia ETH

## 🔑 API Keys Required

Create a `.env` file with:
```
OPENAI_API_KEY=your_openai_key
NEWS_API_KEY=your_newsapi_key
SPORTSDATA_API_KEY=your_sportsdata_key
PRIVATE_KEY=your_wallet_private_key
ARBITRUM_SEPOLIA_RPC=your_rpc_url
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Install contract dependencies
cd contracts
npm install

# Install CRE workflow dependencies
cd ../cre-workflow
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Deploy Contracts
```bash
cd contracts
npx hardhat compile
npx hardhat deploy --network arbitrum-sepolia
```

### 3. Test CRE Workflow
```bash
cd cre-workflow
chainlink-cre simulate src/settlement-workflow.ts
```

### 4. Run Frontend
```bash
cd frontend
npm run dev
```

## 🧪 Testing

### Smart Contract Tests
```bash
cd contracts
npx hardhat test
```

### CRE Workflow Simulation
```bash
cd cre-workflow
chainlink-cre simulate src/settlement-workflow.ts --config config/cre.config.json
```

## 📖 How It Works

### 1. Market Creation
Anyone can create a prediction market with:
- Question (e.g., "Will it rain in London tomorrow?")
- Possible outcomes (e.g., "Yes", "No")
- Betting deadline

### 2. Privacy-Preserving Betting
Users place bets using commitment scheme:
1. Generate random secret
2. Create commitment: `hash(betAmount + outcome + secret)`
3. Submit commitment to contract (bet is hidden)
4. Store secret locally for later reveal

### 3. Reveal Phase
After betting deadline:
1. Users reveal their bets with the secret
2. Contract verifies commitment matches reveal
3. Invalid reveals are rejected

### 4. AI-Powered Settlement
CRE workflow automatically:
1. Fetches data from multiple sources (News API, SportsData, etc.)
2. Sends data to GPT-4 for analysis
3. Requires consensus from 3+ sources
4. Submits verified outcome to blockchain
5. Triggers settlement

### 5. Winner Payout
Winners claim their share of the prize pool proportional to their bet amount.

## 🔒 Privacy Guarantees

- **During Betting**: All bets are hidden via cryptographic commitments
- **After Reveal**: Bets become public (necessary for prize distribution)
- **No Identity Required**: Wallet addresses only, no KYC
- **Transparent Settlement**: AI decision-making is auditable

## 🎥 Demo Video

[Link to 3-5 minute demo video]

## 📄 Chainlink Integration Points

### CRE Workflow
- **File**: `cre-workflow/src/settlement-workflow.ts`
- **Purpose**: Orchestrates AI-powered outcome verification
- **External Integrations**: OpenAI, News API, SportsData
- **Blockchain Interaction**: Reads market data, submits settlements

### Oracle Contract
- **File**: `contracts/src/CRESettlementOracle.sol`
- **Purpose**: Receives verified outcomes from CRE
- **Chainlink Features**: CRE integration, multi-source verification

## 🏆 Hackathon Tracks

This project qualifies for:
1. ✅ **Prediction Markets** - Core functionality
2. ✅ **CRE & AI** - AI-powered settlement via CRE
3. ✅ **Risk & Compliance** - Privacy-preserving with transparent settlement

## 📝 License

MIT