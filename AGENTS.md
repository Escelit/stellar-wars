# Agents Instructions for Stellar Wars

This file provides context for AI coding assistants working on this project.

## Project Overview
- Stellar Wars is a branching narrative war game on the Stellar blockchain (Soroban smart contracts)
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- Backend: Express + TypeScript + Prisma + PostgreSQL
- Smart contracts: Rust (Soroban SDK) compiled to WASM
- Monorepo with npm workspaces: `client/`, `server/`, `contracts/`

## Conventions
- TypeScript strict mode, no `any` unless explicitly justified
- React functional components with hooks, no class components
- File names: PascalCase for components, camelCase for utilities
- Barrel exports from `index.ts` files
- Conventional Commits for commit messages
- Path aliases: `@/` maps to `src/` in both client and server

## Key Commands
- `npm run dev` — start both client (port 3000) and server (port 4000)
- `npm run typecheck` — TypeScript type checking for both workspaces
- `npm run lint` — ESLint with zero-warning policy
- `npm run format:fix` — Prettier formatting
- `npm run contracts:build` — compile Rust contracts to WASM
- `npm run contracts:test` — run Rust contract unit tests

## Project Structure
- `client/` — Vite React app (port 3000)
- `server/` — Express API (port 4000)
- `contracts/` — Soroban smart contracts (Rust)
- `scripts/` — deployment and utility scripts
- `src/stellar/` — shared Stellar SDK wrappers (to be created)

## Code Quality Rules
1. Never commit secrets or API keys
2. All new features must include tests
3. Run `typecheck` and `lint` before committing
4. Keep Prisma schema in sync with migrations
5. Smart contract changes require passing `cargo test`
