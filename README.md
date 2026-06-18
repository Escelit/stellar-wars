# ⚔️ Stellar Wars

> A branching narrative war game powered by the Stellar blockchain — mint NFT commanders, lead galactic empires, and forge history through every choice you make.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Smart Contracts (Soroban)](#smart-contracts-soroban)
- [Game Mechanics](#game-mechanics)
- [Stellar Integration](#stellar-integration)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)

---

## Overview

Stellar Wars is a historical-inspired galactic empire war game built on the [Stellar](https://stellar.org) blockchain. Players mint unique NFT commanders and armies, then navigate a rich branching narrative where every decision reshapes the fate of their empire.

Each commander is governed by a Soroban smart contract — truly owned by the player, tradable on a trustless marketplace, and carrying a permanent battle record on-chain. No two playthroughs are alike.

---

## Features

- **Branching Narrative** — hundreds of story nodes with choices that have lasting consequences across your campaign
- **NFT Commanders** — mint unique commanders via the `MintController` Soroban contract; each has stats, lore, and a battle history stored on-chain
- **NFT Armies** — assemble fleets of unit NFTs with varying strengths, weaknesses, and historical lore
- **On-Chain Battle History** — every battle outcome is immutably recorded via the `BattleRegistry` contract
- **Trustless Marketplace** — buy and sell commanders on-chain via the `Marketplace` contract with automatic fee distribution
- **Wallet Connect** — connect via Freighter, LOBSTR, or any Stellar-compatible wallet
- **Multiplayer Campaigns** — challenge other players' empires in asynchronous narrative conflicts
- **Historical Galactic Lore** — a deep universe inspired by ancient empires, space-age warfare, and political intrigue

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Tailwind CSS |
| Blockchain | Stellar Network + Soroban (Testnet / Mainnet) |
| Smart Contracts | Soroban (Rust → WASM) |
| Wallet | Freighter API / Stellar SDK / `@stellar/stellar-sdk` |
| Backend | Node.js, Express |
| Database | PostgreSQL (off-chain narrative state) |
| Storage | IPFS / Pinata (NFT metadata & artwork) |
| Hosting | Vercel (frontend), Railway (backend) |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      Player Browser                      │
│   React App  ──  Freighter Wallet  ──  Stellar SDK       │
└───────────────────────┬──────────────────────────────────┘
                        │
           ┌────────────▼────────────┐
           │      Game Backend       │
           │  Express API + Postgres │
           │  (narrative state, save │
           │   data, leaderboards)   │
           └────────────┬────────────┘
                        │
      ┌─────────────────▼───────────────────────┐
      │           Stellar Network               │
      │                                         │
      │  ┌─────────────────────────────────┐    │
      │  │      Soroban Smart Contracts    │    │
      │  │                                 │    │
      │  │  MintController                 │    │
      │  │  ├─ mint_commander()            │    │
      │  │  ├─ transfer()                  │    │
      │  │  └─ mark_fallen()               │    │
      │  │                                 │    │
      │  │  BattleRegistry                 │    │
      │  │  ├─ record_battle()             │    │
      │  │  ├─ get_commander_stats()       │    │
      │  │  └─ get_player_battles()        │    │
      │  │                                 │    │
      │  │  Marketplace                    │    │
      │  │  ├─ list_commander()            │    │
      │  │  ├─ buy_commander()             │    │
      │  │  └─ cancel_listing()            │    │
      │  └─────────────────────────────────┘    │
      └─────────────────────────────────────────┘
                        │
           ┌────────────▼────────────┐
           │          IPFS           │
           │  Commander artwork,     │
           │  unit metadata JSON     │
           └─────────────────────────┘
```

---

## Getting Started

### Prerequisites

- Node.js >= 18.x
- Rust >= 1.74 with `wasm32-unknown-unknown` target
- Stellar CLI (`cargo install --locked stellar-cli`)
- A Stellar wallet (recommended: [Freighter](https://freighter.app))
- PostgreSQL 14+
- An IPFS node or [Pinata](https://pinata.cloud) account

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/stellar-wars.git
cd stellar-wars

# Install JS dependencies
npm install

# Add Rust WASM target for Soroban
rustup target add wasm32-unknown-unknown

# Copy environment config
cp .env.example .env
```

Edit `.env` with your Stellar keys, contract addresses, database URL, and IPFS config.

### Run in Development

```bash
# Start the backend API
npm run dev:server

# In a separate terminal, start the frontend
npm run dev:client
```

The app will be available at `http://localhost:3000`.

### Run Tests

```bash
npm run test              # JS unit tests
npm run test:e2e          # End-to-end tests (requires testnet)
npm run contracts:test    # Soroban contract tests (Rust)
```

---

## Smart Contracts (Soroban)

Stellar Wars uses three Soroban smart contracts written in Rust and compiled to WASM. All contracts live in `contracts/`.

### Overview

| Contract | File | Purpose |
|---|---|---|
| `MintController` | `contracts/mint_controller/` | Minting, ownership, and transfer of commander NFTs |
| `BattleRegistry` | `contracts/battle_registry/` | Immutable battle records and commander stats |
| `Marketplace` | `contracts/marketplace/` | Trustless XLM-based listing, buying, and cancellation |

---

### MintController

Manages the full lifecycle of commander NFTs — minting, transfers, and marking fallen commanders.

#### Key Functions

| Function | Access | Description |
|---|---|---|
| `initialize(admin, max_supply)` | Admin | Deploy and configure the contract |
| `mint_commander(owner, name, faction, rarity, stats..., ipfs_cid)` | Any player | Mint a new commander NFT |
| `transfer(from, to, commander_id)` | Owner | Transfer a commander to another player |
| `mark_fallen(caller, commander_id)` | Admin only | Permanently mark a commander as fallen after death |
| `get_commander(id)` | Public | Fetch full commander record |
| `get_owned_commanders(owner)` | Public | List all commander IDs owned by an address |
| `pause(admin)` / `unpause(admin)` | Admin | Halt or resume minting |

#### Commander Data

```rust
pub struct Commander {
    pub id: u64,
    pub owner: Address,
    pub name: String,
    pub faction: String,
    pub rarity: Rarity,       // Common | Uncommon | Rare | Legendary
    pub attack: u32,          // 1–100
    pub defense: u32,
    pub strategy: u32,
    pub influence: u32,
    pub morale: u32,          // degrades with defeats
    pub battles_fought: u32,
    pub victories: u32,
    pub is_fallen: bool,
    pub minted_at: u64,
    pub metadata_ipfs_cid: String,
}
```

#### Deploy & Invoke

```bash
# Build
cd contracts && cargo build --target wasm32-unknown-unknown --release

# Deploy to testnet
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/mint_controller.wasm \
  --source YOUR_SECRET_KEY \
  --network testnet

# Initialize
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source YOUR_SECRET_KEY \
  --network testnet \
  -- initialize \
  --admin <ADMIN_ADDRESS> \
  --max_supply 10000

# Mint a commander
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source PLAYER_SECRET_KEY \
  --network testnet \
  -- mint_commander \
  --owner <PLAYER_ADDRESS> \
  --name "Admiral Kael" \
  --faction "Iron Syndicate" \
  --rarity Legendary \
  --attack 90 --defense 75 --strategy 95 --influence 80 \
  --metadata_ipfs_cid "QmYourIPFSCIDHere"
```

---

### BattleRegistry

Records every battle outcome permanently on-chain. Acts as the immutable war chronicle of the game.

#### Key Functions

| Function | Access | Description |
|---|---|---|
| `initialize(admin)` | Admin | Deploy the registry |
| `record_battle(caller, commander_id, attacker, defender, ...)` | Admin only | Write a battle outcome to the ledger |
| `get_battle(battle_id)` | Public | Retrieve a full battle record |
| `get_player_battles(player)` | Public | List all battle IDs for a player |
| `get_commander_stats(commander_id)` | Public | Running wins/losses/morale for a commander |
| `total_battles()` | Public | Total battles recorded globally |

#### Battle Record Structure

```rust
pub struct BattleRecord {
    pub battle_id: u64,
    pub commander_id: u64,
    pub attacker: Address,
    pub defender: Address,
    pub attacker_faction: String,
    pub defender_faction: String,
    pub strategy_used: BattleStrategy,  // Offensive | Defensive | Flanking | Diplomatic
    pub outcome: BattleOutcome,         // Victory | Defeat | Draw
    pub attacker_losses: u32,           // 0–100
    pub defender_losses: u32,
    pub narrative_node_id: String,      // links to story node
    pub timestamp: u64,
    pub commander_fell: bool,
}
```

#### Morale System

- **Victory** → morale +5 (capped at 100)
- **Defeat** → morale −10
- **Commander fell** → morale → 0

When morale hits 0, the commander is rendered inactive in the narrative engine until `mark_fallen` is called on `MintController`.

---

### Marketplace

A fully trustless on-chain marketplace for buying and selling commanders with XLM. Handles escrow and automatic fee distribution.

#### Key Functions

| Function | Access | Description |
|---|---|---|
| `initialize(admin, xlm_token, fee_bps)` | Admin | Deploy with fee configuration |
| `list_commander(seller, commander_id, price_stroops)` | Owner | Create a listing |
| `buy_commander(buyer, listing_id)` | Any player | Purchase a listed commander |
| `cancel_listing(seller, listing_id)` | Seller | Remove an active listing |
| `get_listing(listing_id)` | Public | Fetch a listing by ID |
| `get_commander_listing(commander_id)` | Public | Find the active listing for a commander |
| `get_seller_listings(seller)` | Public | All listing IDs for a seller |
| `set_fee_bps(admin, fee_bps)` | Admin | Update the marketplace fee |

#### Fee Structure

The default marketplace fee is **2.5%** (250 basis points). On each sale:

```
seller receives  =  price − fee
treasury receives =  fee  (2.5% of price)
```

Fees are transferred atomically in the same transaction — no separate withdrawal step needed.

#### Price Convention

All prices are in **stroops** (1 XLM = 10,000,000 stroops):

```typescript
const FIVE_XLM_IN_STROOPS = 50_000_000n;
```

---

### Running Contract Tests

```bash
cd contracts
cargo test
```

All three contracts include unit test suites covering minting, battle recording, morale logic, marketplace listing/buying/cancelling, and edge cases (invalid stats, self-purchase, paused minting).

---

### Contract Addresses (Testnet)

> These will be populated after initial deployment.

| Contract | Testnet Address |
|---|---|
| MintController | `C...` |
| BattleRegistry | `C...` |
| Marketplace | `C...` |

---

## Game Mechanics

### The Narrative Engine

The story is structured as a directed graph of **nodes** and **choices**:

- Each node contains story text, artwork, and 2–4 player choices
- Choices branch into new nodes based on player decisions AND the stats of the active commander
- A commander with high `strategy` unlocks diplomatic options; high `attack` unlocks aggressive routes
- Choices made in early chapters permanently alter the options available later

### Commander Stats

| Stat | Description |
|---|---|
| `attack` | Determines outcome in direct battle nodes |
| `defense` | Reduces losses when ambushed or outnumbered |
| `strategy` | Unlocks non-combat resolutions and alliances |
| `influence` | Affects political choices and NPC loyalty |
| `morale` | Degrades with defeats; collapses below 10 |

### Battle System

Battles are resolved using a weighted random algorithm that factors in:

1. Commander stats
2. Army composition (unit types deployed)
3. Player's chosen battle strategy (offensive / defensive / flanking / diplomatic)
4. Random variance (fog of war)

Outcomes are written to the `BattleRegistry` contract and are permanently verifiable on the Stellar ledger.

### Death & Legacy

If a commander's morale reaches 0 after a fatal defeat, `mark_fallen` is called on `MintController`. Fallen commanders cannot fight again but retain their full battle history on-chain as a permanent legacy. A new commander can be minted to continue the campaign.

---

## Stellar Integration

### Network Configuration

By default the app runs on **Stellar Testnet** for development. Set `STELLAR_NETWORK=mainnet` in production.

```typescript
// src/stellar/config.ts
export const STELLAR_HORIZON =
  process.env.STELLAR_NETWORK === 'mainnet'
    ? 'https://horizon.stellar.org'
    : 'https://horizon-testnet.stellar.org';

export const SOROBAN_RPC =
  process.env.STELLAR_NETWORK === 'mainnet'
    ? 'https://mainnet.sorobanrpc.com'
    : 'https://soroban-testnet.stellar.org';
```

### Wallet Connection (Freighter)

```typescript
import freighter from '@stellar/freighter-api';

const { publicKey } = await freighter.getPublicKey();
```

### Calling a Soroban Contract

```typescript
import { Contract, SorobanRpc, TransactionBuilder, Networks } from '@stellar/stellar-sdk';

const server = new SorobanRpc.Server(SOROBAN_RPC);
const contract = new Contract(MINT_CONTROLLER_ADDRESS);

const tx = new TransactionBuilder(sourceAccount, { fee: BASE_FEE })
  .addOperation(contract.call('mint_commander', ...args))
  .setTimeout(30)
  .build();

const preparedTx = await server.prepareTransaction(tx);
const signedTx = await freighter.signTransaction(preparedTx.toXDR());
const result = await server.sendTransaction(
  TransactionBuilder.fromXDR(signedTx, Networks.TESTNET)
);
```

---

## Project Structure

```
stellar-wars/
├── client/                     # React frontend
│   └── src/
│       ├── components/         # UI components
│       ├── hooks/              # useStellarWallet, useCommander, useBattle...
│       ├── pages/              # Route pages
│       └── store/              # Zustand state
├── server/                     # Express backend
│   ├── routes/
│   ├── controllers/
│   └── models/                 # Prisma / Postgres
├── contracts/                  # Soroban smart contracts (Rust)
│   ├── Cargo.toml              # Workspace config
│   ├── mint_controller/        # Commander NFT minting & ownership
│   │   └── src/lib.rs
│   ├── battle_registry/        # Immutable battle records
│   │   └── src/lib.rs
│   └── marketplace/            # Trustless XLM marketplace
│       └── src/lib.rs
├── src/stellar/                # JS Stellar SDK wrappers
│   ├── config.ts
│   ├── contracts.ts            # Contract invocation helpers
│   ├── wallet.ts               # Freighter integration
│   └── ipfs.ts                 # IPFS/Pinata upload helpers
├── narrative/                  # Story data
│   ├── nodes/                  # JSON story node files
│   └── factions/               # Faction lore
├── scripts/                    # Utility scripts
│   ├── deploy-contracts.sh     # Deploy all three contracts
│   ├── testnet-setup.sh        # Fund testnet accounts
│   └── mint-batch.ts           # Batch mint commanders from CSV
├── .env.example
├── package.json
└── README.md
```

---

## Environment Variables

```env
# Stellar
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
ISSUER_PUBLIC_KEY=G...
ISSUER_SECRET_KEY=S...

# Soroban Contract Addresses (populated after deploy)
MINT_CONTROLLER_CONTRACT=C...
BATTLE_REGISTRY_CONTRACT=C...
MARKETPLACE_CONTRACT=C...

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/stellarwars

# IPFS / Pinata
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret

# App
PORT=4000
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:3000
```

> ⚠️ **Never commit your `ISSUER_SECRET_KEY` or `JWT_SECRET` to version control.**

---

## Scripts

```bash
npm run dev:client            # Start React dev server
npm run dev:server            # Start Express API server
npm run build                 # Build frontend for production
npm run db:migrate            # Run Prisma migrations
npm run db:seed               # Seed narrative node data

# Soroban
npm run contracts:build       # Compile all contracts to WASM
npm run contracts:test        # Run Rust unit tests
npm run contracts:deploy      # Deploy contracts to testnet
npm run contracts:deploy:main # Deploy contracts to mainnet

# Utilities
npm run stellar:fund          # Fund testnet account via Friendbot
npm run mint:batch            # Batch mint commanders from CSV
npm run ipfs:upload           # Upload artwork to IPFS/Pinata
npm run lint                  # ESLint + Prettier check
npm run test                  # Run all JS tests
```

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for our code of conduct and pull request process.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push the branch: `git push origin feature/your-feature`
5. Open a Pull Request

We use [Conventional Commits](https://www.conventionalcommits.org/) for all commit messages.

---

## Roadmap

- [x] Project scaffolding & Stellar SDK integration
- [x] Soroban smart contract architecture (MintController, BattleRegistry, Marketplace)
- [x] Freighter wallet connection
- [x] Narrative engine (API + hooks + pages)
- [x] NFT minting UI (page + hooks)
- [x] Marketplace UI (page + components)
- [ ] Deploy contracts to testnet
- [ ] Populate narrative story content
- [ ] Battle resolution system connected to BattleRegistry
- [ ] Multiplayer campaign mode
- [ ] Mobile-responsive UI
- [ ] Mainnet launch
- [ ] DAO governance for narrative expansions

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">Built with ⚔️ on the <a href="https://stellar.org">Stellar Network</a> using <a href="https://soroban.stellar.org">Soroban</a></p>
