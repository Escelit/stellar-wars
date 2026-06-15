# Agents Instructions for Stellar Wars

This file provides context for AI coding assistants working on this project.

## Project Overview
- Stellar Wars is a branching narrative war game on the Stellar blockchain (Soroban smart contracts)
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS (port 3000)
- Backend: Express + TypeScript + Prisma + PostgreSQL (port 4000)
- Smart contracts: Rust (Soroban SDK) compiled to WASM
- Monorepo with npm workspaces: `client/`, `server/`; `contracts/` is a separate Cargo workspace

## Conventions
- TypeScript strict mode, no `any` unless explicitly justified
- React functional components with hooks, no class components
- File names: PascalCase for components, camelCase for utilities
- Barrel exports from `index.ts` files
- Conventional Commits for commit messages
- Path aliases: `@/` maps to `src/` in both client and server

## Key Commands
- `npm run dev` — start both client (port 3000) and server (port 4000)
- `npm run lint` — ESLint with zero-warning policy
- `npm run typecheck` — TypeScript type checking for both workspaces
- `npm run format:fix` — Prettier formatting
- `npm run test` — run all JS/TS tests
- `npm run contracts:build` — compile Rust contracts to WASM
- `npm run contracts:test` — run Rust contract unit tests
- `npm run contracts:deploy` — deploy contracts to Stellar testnet
- `npm run db:migrate` — run Prisma migrations
- `npm run db:seed` — seed the database with sample narrative nodes

## Project Structure
- `client/` — Vite React app (port 3000)
  - `src/pages/` — route page components
  - `src/components/` — reusable UI components
  - `src/components/ui/` — base UI primitives (Button, Card, Modal, etc.)
  - `src/hooks/` — custom React hooks
  - `src/stellar/` — Stellar SDK wrappers (config, contracts, wallet, IPFS, Soroban helpers)
- `server/` — Express API (port 4000)
  - `src/routes/` — API route handlers (auth, narrative, saves, playthrough)
  - `src/middleware/` — Express middleware (auth, error handler)
  - `src/lib/` — utility libraries (JWT)
  - `prisma/` — Prisma schema, migrations, seed
  - `src/__tests__/` — API integration tests
- `contracts/` — Soroban smart contracts (Rust)
  - `mint_controller/` — commander NFT minting (14+ tests)
  - `battle_registry/` — battle resolution system (16+ tests)
  - `marketplace/` — commander marketplace (~20 tests)
- `scripts/` — deployment and utility scripts
- `src/stellar/` — shared Stellar SDK wrappers (root copy)
- `docs/` — ARCHITECTURE.md, SETUP.md
- `.github/` — CI workflows, issue templates, CODEOWNERS, Dependabot

## Code Quality Rules
1. Never commit secrets or API keys
2. All new features must include tests
3. Run `typecheck` and `lint` before committing
4. Keep Prisma schema in sync with migrations
5. Smart contract changes require passing `cargo test`
6. Pull requests require passing CI (lint + typecheck + test + contracts:test)
