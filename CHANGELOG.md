# Changelog

All notable changes to Stellar Wars are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] — 2026-06-15

### Added
- **Soroban Smart Contracts**: Three fully-tested contracts (50+ tests)
  - `MintController` — commander NFT minting, transfer, fallen marking
  - `BattleRegistry` — battle recording, morale system, stats queries
  - `Marketplace` — commander listing, buying, fee distribution (2.5%)
- **Stellar SDK Wrappers**: Typed contract invocation, Freighter wallet integration, IPFS upload helpers
- **Wallet Connect**: Freighter wallet connection with `useStellarWallet` hook, network detection, route guards
- **Backend API** (Express + Prisma + PostgreSQL):
  - JWT auth via Stellar signed challenges (`POST /auth/connect`)
  - Narrative engine with branching story graph, stat-gated choices
  - Save/Load system with multiple slots
  - Playthrough management and choice history
- **Frontend** (React 18 + Vite + Tailwind):
  - Full routing with protected routes
  - Commander minting UI with stat preview
  - Commander gallery with detail modal
  - Narrative game page with choice cards, commander HUD, chapter transitions
  - Save/Load modal
  - Dark theme game aesthetic
- **Documentation**: ARCHITECTURE.md, SETUP.md, CONTRIBUTING.md, AGENTS.md
- **CI/CD**: GitHub Actions workflows for test and deploy, Dependabot, issue templates
- **Developer Experience**: Concurrent dev servers, Prisma Studio, formatting scripts

### Technical
- Monorepo with npm workspaces (client + server)
- TypeScript strict mode throughout
- 30+ API integration tests, 50+ Rust contract unit tests
- Conventional Commits enforced
- Lazy-loaded routes for optimized bundle size
- Rate limiting (100 req/min) on API
- Environment validation at startup
- CORS restricted to configured client origin

[0.5.0]: https://github.com/Escelit/stellar-wars/releases/tag/v0.5.0
