# Stellar Wars — Architecture

## System Overview

Stellar Wars is a branching narrative war game built on the Stellar blockchain. Players mint NFT commanders, progress through a story-driven campaign, and engage in turn-based battles — all recorded on-chain via Soroban smart contracts.

```
┌─────────────────────────────────────────────────────────┐
│                      Browser                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │         React SPA (Vite, port 3000)              │   │
│  │  ┌──────────┐ ┌──────────┐ ┌─────────────────┐  │   │
│  │  │  Pages   │ │Components│ │  Stellar SDK     │  │   │
│  │  │ /mint    │ │  Layout  │ │  (Wallet,        │  │   │
│  │  │ /game    │ │  Cards   │ │   Contracts,     │  │   │
│  │  │ /market  │ │  HUD     │ │   Soroban)      │  │   │
│  │  │ /command │ │  Modals  │ │                  │  │   │
│  │  └──────────┘ └──────────┘ └─────────────────┘  │   │
│  │                       │                          │   │
│  │              Freighter Wallet                    │   │
│  └───────────────────────┬──────────────────────────┘   │
└──────────────────────────┼──────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
┌──────────────────────┐   ┌──────────────────────────┐
│   Express API        │   │   Soroban RPC            │
│   (port 4000)        │   │   (Stellar Testnet)       │
│                      │   │                          │
│  ┌────────────────┐  │   │  ┌────────────────────┐  │
│  │ Auth Routes    │  │   │  │ MintController     │  │
│  │ POST /connect  │  │   │  │ (Commander NFTs)   │  │
│  │ GET  /me       │  │   │  └────────────────────┘  │
│  └────────────────┘  │   │  ┌────────────────────┐  │
│  ┌────────────────┐  │   │  │ BattleRegistry     │  │
│  │ Narrative API  │  │   │  │ (Battle Records)   │  │
│  │ GET  /node/:id │  │   │  └────────────────────┘  │
│  │ POST /choose   │  │   │  ┌────────────────────┐  │
│  └────────────────┘  │   │  │ Marketplace         │  │
│  ┌────────────────┐  │   │  │ (Listings/Trades)  │  │
│  │ Save/Load API  │  │   │  └────────────────────┘  │
│  │ POST /save     │  │   └──────────────────────────┘
│  │ GET  /save/:id │  │
│  └────────────────┘  │
│  ┌────────────────┐  │
│  │ Prisma ORM     │  │
│  └───────┬────────┘  │
└──────────┼────────────┘
           ▼
┌──────────────────────┐
│   PostgreSQL         │
│                      │
│  Tables:             │
│  - User              │
│  - NarrativeNode     │
│  - Playthrough       │
│  - Choice            │
│  - SaveGame          │
└──────────────────────┘
```

## Data Flow

### Player Connects Wallet
```
Freighter ←→ useStellarWallet hook → WalletProvider context
     ↓
POST /api/auth/challenge → { message }
     ↓
Freighter signs message → { signature }
     ↓
POST /api/auth/connect → JWT token
     ↓
Auth middleware attaches user to req
```

### Player Mints Commander
```
MintPage → useStellarWallet.sign()
     ↓
Soroban RPC: MintController.mint_commander()
     ↓
Transaction confirmed on testnet
     ↓
Commander data displayed in gallery
```

### Player Plays Narrative
```
GamePage → GET /api/narrative/node/:id → NarrativeNode
     ↓
ChoiceCard → POST /api/narrative/choose
     ↓
Stat-gating validation → next node response
     ↓
CommanderHUD shows updated stats/morale
     ↓
SaveGame → POST /api/save → persisted in PostgreSQL
```

## Smart Contracts

### MintController
- **Purpose**: Mint, transfer, and manage commander NFTs
- **Storage**: `Commander` structs mapped by ID, owner mappings
- **Key Functions**: `initialize`, `mint_commander`, `transfer`, `mark_fallen`, `pause`/`unpause`
- **Tests**: 14+ unit tests

### BattleRegistry
- **Purpose**: Record battles, track commander stats and morale
- **Storage**: `BattleRecord`, `CommanderStats` with morale system
- **Key Functions**: `initialize`, `record_battle`, `get_commander_stats`
- **Morale System**: Victory +5, defeat −10, fallen → 0
- **Tests**: 16+ unit tests

### Marketplace
- **Purpose**: List and trade commander NFTs
- **Storage**: `Listing` structs with pricing in XLM
- **Key Functions**: `initialize`, `list_commander`, `buy_commander`, `cancel_listing`
- **Fee**: 2.5% protocol fee to treasury
- **Tests**: ~20 unit tests

## Backend API

### Auth (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/challenge` | Get Stellar sign challenge |
| POST | `/api/auth/connect` | Verify signature, return JWT |

### Narrative (`/api/narrative`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/narrative/node/:id` | Fetch a story node |
| POST | `/api/narrative/choose` | Submit a choice (stat-gated) |
| GET | `/api/narrative/choices/:playthroughId` | Choice history |

### Save/Load
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/save` | Save game state |
| GET | `/api/save/:playthroughId` | Load game state |
| GET | `/api/saves` | List all saves for user |

## Frontend Architecture

### Routing (React Router v6)
```
/               → HomePage (public)
├── /mint       → MintPage (protected)
├── /game       → GamePage (protected)
├── /commanders → CommandersPage (protected)
├── /marketplace → MarketplacePage (protected)
└── /profile    → ProfilePage (protected)
```

### State Management
- **Wallet state**: React Context (`WalletProvider`)
- **Game state**: API-driven (save/load from server)
- **Component state**: Local state with hooks

### Key Components
- `Layout` — Sidebar nav + header + wallet button
- `WalletProvider` — Freighter wallet connection context
- `ProtectedRoute` — Route guard (redirect if not connected)
- `CommanderHUD` — Overlay showing stats, morale, faction
- `ChoiceCard` — Narrative choice with stat-gate styling
- `SaveLoadModal` — Save/load game management

## Security

- **JWT Authentication**: Stateless tokens, verified on every protected request
- **Stellar Signatures**: Challenge-response authentication (no private keys on server)
- **Input Validation**: All API inputs validated before processing
- **Rate Limiting**: API endpoints protected against abuse
- **Environment Validation**: Required vars checked at startup
- **CORS**: Restricted to configured client origin

## Development

### Prerequisites
- Node.js 20+, npm 10+
- Docker (PostgreSQL)
- Rust toolchain with WASM target
- Stellar CLI (`stellar`)
- Freighter browser extension

### Local Setup
```bash
npm install
cp .env.example .env
docker compose up -d
npm run db:migrate && npm run db:seed
npm run dev
```

### Testing
```bash
npm run typecheck   # TypeScript validation
npm run lint        # ESLint (zero warnings)
npm run test        # JS/TS tests
npm run contracts:test  # Rust tests
```

### Deployment
```bash
npm run contracts:build   # Compile to WASM
npm run contracts:deploy  # Deploy to testnet
```
