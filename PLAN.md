# Stellar Wars — 14-Day Sprint to 50%

> **Goal**: From empty repo to a fully scaffolded, testable, contributor-ready codebase with working smart contracts on testnet, a functional backend API, a navigable frontend, and complete developer documentation.

## Progress Framework

The README roadmap defines 12 milestones. "50% completion" means delivering the first **6 milestones** as production-ready, plus establishing the patterns and tooling for the remaining 6:

| # | Milestone | Status Target | Deliverables |
|---|-----------|--------------|-------------|
| 1 | Project scaffolding & Stellar SDK integration | ✅ Done | `package.json`, `tsconfig`, Tailwind, folder structure, Stellar SDK wired |
| 2 | Soroban smart contract architecture | 🟡 75% | MintController (14 tests), BattleRegistry (16 tests), Marketplace pending |
| 3 | Freighter wallet connection | ✅ Done | `useStellarWallet` hook, connect/disconnect/sign flows |
| 4 | Deploy contracts to testnet | ✅ Done | Deployed addresses, deployment scripts, CI verify step |
| 5 | NFT minting UI | ✅ Done | Mint page, commander gallery, transaction flow |
| 6 | Narrative engine with branching story graph | ✅ Done | Node editor, story router, save/load system |
| 7 | Battle resolution system | 🟡 50% | Core algorithm done, partial UI |
| 8 | Marketplace UI | 🟡 50% | Contract done, basic list/buy UI |
| 9–12 | Multiplayer / Mobile / Mainnet / DAO | ❌ Later | Not in scope |

---

## Sprint Schedule

### Week 1 — Foundation & Contracts

#### Day 1 — Monorepo Scaffolding ###
- Initialize workspace: `package.json`, `tsconfig` (base/client/server), ESLint, Prettier
- Set up `client/` (Vite + React 18 + Tailwind CSS)
- Set up `server/` (Express + TypeScript + Prisma)
- Create `.env.example`, `docker-compose.yml` (PostgreSQL)
- Create `AGENTS.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`
- Configure `scripts/` stubs (`deploy-contracts.sh`, `testnet-setup.sh`)

#### Day 2 — Soroban Contracts: MintController ✅
- ✅ Initialize `contracts/` Cargo workspace
- ✅ Implement `MintController` contract:
  - Storage types (`Commander`, `Rarity` enums)
  - `initialize`, `mint_commander`, `transfer`, `mark_fallen`
  - `get_commander`, `get_owned_commanders`
  - `pause` / `unpause`
- ✅ Write unit tests covering: minting, transfer, fallen marking, paused state, invalid stats
- ✅ Verify `cargo test` passes — all 14 tests pass, zero warnings

#### Day 3 — Soroban Contracts: BattleRegistry ✅
- ✅ Implement `BattleRegistry` contract:
  - ✅ Storage types (`BattleRecord`, `BattleStrategy`, `BattleOutcome`, `CommanderStats`)
  - ✅ `initialize`, `record_battle`, `get_battle`, `get_player_battles`, `get_commander_stats`
  - ✅ Morale system (victory +5, defeat −10, fallen → 0)
- ✅ Write unit tests covering: battle recording, stats queries, morale edge cases, pause/unpause
- ✅ Verify `cargo test` passes — 16 BattleRegistry + 14 MintController = 30 tests pass, zero warnings

#### Day 4 — Soroban Contracts: Marketplace
- Implement `Marketplace` contract:
  - Storage types (`Listing`)
  - `initialize`, `list_commander`, `buy_commander`, `cancel_listing`
  - Fee distribution (2.5% to treasury)
  - Query functions (`get_listing`, `get_commander_listing`, `get_seller_listings`)
- Write unit tests covering: listing, buying, cancellation, self-purchase prevention, fee math
- Verify `cargo test` passes for all contracts

#### Day 5 — Contract Polish + Deploy to Testnet
- Audit contract code: access control, overflow safety, edge cases
- Write integration tests (cross-contract scenarios)
- Create `scripts/deploy-contracts.sh` with idempotent deployment
- Deploy all 3 contracts to Stellar Testnet
- Capture deployed addresses, update `.env.example`
- Add `contracts:test` and `contracts:deploy` npm scripts

#### Day 6 — Stellar SDK Wrappers ✅
- ✅ Create `src/stellar/config.ts` — network constants
- ✅ Create `src/stellar/contracts.ts` — typed invocation helpers for all 3 contracts
- ✅ Create `src/stellar/wallet.ts` — Freighter API wrapper (connect, disconnect, sign, getNetwork)
- ✅ Create `src/stellar/ipfs.ts` — Pinata/IPFS upload helper
- ✅ Add Soroban helpers: `simulateContractCall`, `sendContractCall`, `parseContractResult`
- ✅ Unit tests for SDK wrappers (mocked Freighter)

#### Day 7 — Wallet Connect Integration ✅
- ✅ Build `useStellarWallet` React hook (connect, disconnect, account watcher, network check)
- ✅ Build `WalletProvider` context component
- ✅ Create wallet connection UI: button, modal, status indicator
- ✅ Wire network detection (prompt switch to testnet if on wrong network)
- ✅ Handle edge cases: wallet not installed, connection rejected, network mismatch
- ✅ E2E interaction: connect wallet → call `mint_commander` view function → display result

---

### Week 2 — Backend, Frontend & Polish

#### Day 8 — Backend: Prisma + Auth ✅
- ✅ Define Prisma schema: `User`, `SaveGame`, `NarrativeNode`, `Playthrough`
- ✅ Run `prisma migrate dev`
- ✅ Create Express app scaffold: middleware (CORS, auth, error handler), route structure
- ✅ Implement JWT auth: `POST /auth/connect` (verify Stellar signed challenge), `GET /auth/me`
- ✅ Add Prisma seed script with sample narrative nodes
- ✅ Write API integration tests — 11 tests passing

#### Day 9 — Backend: Narrative Engine API
- Implement narrative endpoints:
  - `GET /narrative/node/:id` — fetch a story node
  - `POST /narrative/choose` — submit a choice, return next node
  - `GET /narrative/choices/:playthroughId` — choice history
- Implement branching logic: stat-gated choices (e.g., `strategy >= 70` unlocks diplomatic route)
- Implement save/load system:
  - `POST /save` — save game state
  - `GET /save/:playthroughId` — load game state
- Write Prisma queries with proper indexing
- API documentation (inline JSDoc + route list)

#### Day 10 — Frontend: Core Layout + Router
- Set up React Router: `/`, `/mint`, `/game`, `/marketplace`, `/commanders`, `/profile`
- Build `Layout` component (sidebar nav, header, wallet button)
- Create reusable UI components: `Button`, `Card`, `Modal`, `LoadingSpinner`, `Toast`
- Build `PageHeader` and `PageShell` components
- Implement dark theme with Tailwind (matching game aesthetic)
- Add route guards: redirect to connect if wallet not connected

#### Day 11 — Frontend: Commander Minting UI
- Build `/mint` page: mint form (name, faction selection, stat preview)
- Build commander stats visualization (radar chart or stat bars)
- Implement mint transaction flow: prepare → sign → submit → confirm
- Add transaction status tracking (pending, confirmed, failed)
- Build `/commanders` gallery: grid of owned commander cards
- Build commander detail modal/page

#### Day 12 — Frontend: Narrative Engine UI
- Build `/game` page: story display with rich text and artwork placeholder
- Build choice cards (2–4 options per node)
- Implement stat-gated choice styling (locked vs unlocked choices)
- Add commander HUD overlay (stats, morale bar, faction emblem)
- Implement save/load UI from narrative backend
- Build chapter transition screens

#### Day 13 — Documentation + CI/CD
- Write `CONTRIBUTING.md`: PR流程, 代码规范, commit message convention
- Write `AGENTS.md`: instructions for AI coding assistants
- Write `ARCHITECTURE.md`: system design decisions, data flow diagrams
- Set up GitHub Actions CI:
  - `test.yml`: lint + typecheck + `cargo test` + `npm test`
  - `deploy.yml`: deploy contracts to testnet on merge to `main`
- Add `.github/CODEOWNERS`
- Add issue templates (bug report, feature request)
- Add Dependabot config

#### Day 14 — Final Polish + Launch Prep
- End-to-end smoke test: wallet connect → mint commander → start game → make choice → save/load
- Performance audit: bundle size, lazy loading routes, image optimization
- Security audit: environment variable validation, API rate limiting, input sanitization
- Write `SETUP.md` with step-by-step onboarding for new contributors
- Tag `v0.5.0` release
- Announcement post draft for community channels

---

## What 50% Looks Like

After 14 days, the repo will have:

```
stellar-wars/
├── .github/
│   ├── workflows/
│   │   ├── test.yml
│   │   └── deploy.yml
│   ├── ISSUE_TEMPLATE/
│   └── CODEOWNERS
├── client/                    # Vite + React + Tailwind
│   └── src/
│       ├── components/        # ~15 reusable components
│       ├── hooks/             # useStellarWallet, useCommander, useNarrative...
│       ├── pages/             # /mint, /game, /commanders, /profile, /
│       ├── store/             # Zustand stores (wallet, game, commanders)
│       ├── stellar/           # SDK wrappers copied from src/stellar/
│       └── App.tsx            # Router + WalletProvider
├── server/
│   ├── src/
│   │   ├── routes/            # auth, narrative, saves, commanders
│   │   ├── middleware/        # auth, error, validation
│   │   └── prisma/            # schema, migrations, seed
│   └── tests/
├── contracts/
│   ├── Cargo.toml
│   ├── mint_controller/       # Full impl + 20+ tests
│   ├── battle_registry/       # Full impl + 15+ tests
│   ├── marketplace/           # Full impl + 15+ tests
│   └── target/                # Compiled WASM
├── src/stellar/               # JS Stellar SDK wrappers
├── scripts/                   # deploy-contracts.sh, testnet-setup.sh, etc.
├── docs/                      # ARCHITECTURE.md, SETUP.md
├── AGENTS.md
├── CONTRIBUTING.md
├── PLAN.md                    # ← this file
├── docker-compose.yml
├── .env.example
└── package.json
```

**Working end-to-end flows:**
1. User opens app → connects Freighter wallet → sees dashboard
2. User navigates to `/mint` → fills form → signs transaction → commander appears in gallery
3. User navigates to `/game` → reads story → makes choice → next chapter loads
4. User saves game → reloads → state is restored
5. Developer clones repo → `npm install` → `cp .env.example .env` → `npm run dev` → everything works

**Contract-level test coverage:** >85%
**API test coverage:** >70%
**Frontend type coverage:** strict mode, no `any`

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Soroban SDK instability | Pin exact versions, test against testnet, fallback to `soroban-sdk` 20.x |
| Freighter API changes | Wrap in adapter interface, test with mocked provider |
| Testnet downtime | Maintain local `stellar quickstart` docker for offline dev |
| Scope creep | Strict feature freeze after Day 7; cosmetic changes deferred |
| Contributor onboarding gaps | Day 13-14 focused entirely on docs and DX |

---

*Started: June 2, 2026 | Target: June 15, 2026*
