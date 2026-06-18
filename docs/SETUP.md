# Stellar Wars — Setup Guide

> Step-by-step onboarding for new contributors.

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ | JS runtime |
| npm | 10+ | Package manager |
| Docker | 24+ | PostgreSQL container |
| Rust | 1.81+ | Smart contract compilation |
| WASM target | `wasm32-unknown-unknown` | Soroban contract builds |
| Stellar CLI | Latest | Contract deployment |
| Freighter | Browser extension | Wallet connection |

### Install Rust & WASM Target

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown
```

### Install Stellar CLI

```bash
cargo install --locked stellar-cli
```

### Install Freighter

Download the [Freighter wallet extension](https://freighter.app) for Chrome, Firefox, or Edge.

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/Escelit/stellar-wars.git
cd stellar-wars
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values. The defaults work for local development except:
- `JWT_SECRET` — generate one: `openssl rand -base64 32`
- `ISSUER_PUBLIC_KEY` / `ISSUER_SECRET_KEY` — for contract deployment

### 3. Start Database

```bash
docker compose up -d
```

This starts PostgreSQL on port 5432 with credentials from `.env`.

### 4. Run Migrations & Seed

```bash
npm run db:migrate
npm run db:seed
```

This creates the database tables and populates sample narrative nodes.

### 5. Start Development Servers

```bash
npm run dev
```

- **Client**: http://localhost:3000
- **Server**: http://localhost:4000
- **API Health**: http://localhost:4000/api/health

### 6. Verify Setup

```bash
# TypeScript checks
npm run typecheck

# Lint
npm run lint

# Run tests
npm run test
```

All checks should pass with zero errors and zero warnings.

## Smart Contract Development

### Build Contracts

```bash
npm run contracts:build
```

Compiles all Soroban contracts to WASM in `contracts/target/wasm32-unknown-unknown/release/`.

### Run Contract Tests

```bash
npm run contracts:test
```

### Deploy to Testnet

```bash
# 1. Fund your issuer account (one-time)
npm run stellar:fund

# 2. Deploy all contracts
npm run contracts:deploy

# 3. Copy printed contract IDs into .env
```

## Project Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both client and server |
| `npm run build` | Build both for production |
| `npm run lint` | ESLint (zero warnings required) |
| `npm run format:fix` | Prettier formatting |
| `npm run typecheck` | TypeScript validation |
| `npm run test` | Run all JS/TS tests |
| `npm run contracts:build` | Compile Rust contracts to WASM |
| `npm run contracts:test` | Run Rust contract unit tests |
| `npm run contracts:deploy` | Deploy to Stellar testnet |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed narrative nodes |
| `npm run db:studio` | Open Prisma Studio (DB GUI) |
| `npm run stellar:fund` | Fund testnet account via Friendbot |

## Project Structure

```
stellar-wars/
├── client/              Vite + React (port 3000)
│   └── src/
│       ├── components/  Reusable UI components
│       ├── pages/       Route page components
│       ├── hooks/       Custom React hooks
│       └── stellar/     Stellar SDK wrappers
├── server/              Express + Prisma (port 4000)
│   ├── src/
│   │   ├── routes/      API handlers
│   │   ├── middleware/   Express middleware
│   │   └── lib/         Utilities
│   ├── prisma/          Schema, migrations, seed
│   └── src/__tests__/   API tests
├── contracts/           Soroban smart contracts (Rust)
│   ├── mint_controller/ Commander NFT minting
│   ├── battle_registry/ Battle resolution
│   └── marketplace/     NFT marketplace
├── scripts/             Deploy and utility scripts
├── .github/             CI workflows, templates
└── docs/                Architecture docs
```

## Troubleshooting

### PostgreSQL won't start

```bash
# Check Docker
docker ps
docker compose logs postgres

# Port conflict? Change port in docker-compose.yml and .env
```

### Freighter not detected

- Ensure Freighter extension is installed and unlocked
- Check you're on Stellar testnet in Freighter
- Refresh the page after installing

### Contract deployment fails

```bash
# Ensure issuer account is funded
npm run stellar:fund

# Check network config in .env
# Verify stellar CLI is installed
stellar --version
```

### npm install fails

```bash
# Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

- Read [ARCHITECTURE.md](ARCHITECTURE.md) for system design
- Read [CONTRIBUTING.md](CONTRIBUTING.md) for contribution workflow
- Open the app at http://localhost:3000
- Connect your Freighter wallet
- Mint your first commander on the `/mint` page
- Start the campaign at `/game`
