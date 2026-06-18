# Contributing to Stellar Wars

Thank you for your interest in contributing! This document outlines the process, conventions, and standards for contributing to Stellar Wars.

## Code of Conduct

All contributors must adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). We are committed to providing a welcoming and inclusive environment.

## Quick Start

```bash
# Fork and clone the repo
git clone git@github.com:your-username/stellar-wars.git
cd stellar-wars

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Start PostgreSQL
docker compose up -d

# Run database migrations
npm run db:migrate

# Seed the database
npm run db:seed

# Start development servers (client + server)
npm run dev
```

The client runs at **http://localhost:3000** and the server at **http://localhost:4000**.

## Branch Naming

Use descriptive branch names with a type prefix:

| Pattern | Example |
|---------|---------|
| `feat/<description>` | `feat/battle-animations` |
| `fix/<description>` | `fix/wallet-disconnect` |
| `chore/<description>` | `chore/update-deps` |
| `docs/<description>` | `docs/api-endpoints` |
| `refactor/<description>` | `refactor/narrative-engine` |
| `test/<description>` | `test/marketplace-edge-cases` |

## Development Workflow

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Make your changes following the code conventions
3. Run all checks locally:

   ```bash
   npm run typecheck
   npm run lint
   npm run test
   npm run contracts:test   # if smart contract changes
   ```

4. Commit using [Conventional Commits](#commit-convention)
5. Push and open a Pull Request against `main`

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/) for automated changelog generation:

```
<type>(<scope>): <imperative-description>

[optional body]

[optional footer]
```

### Types

| Type | Usage |
|------|-------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `chore` | Maintenance, deps, tooling |
| `docs` | Documentation only |
| `refactor` | Code change that neither fixes nor adds |
| `test` | Adding or fixing tests |
| `style` | Formatting, linting (no logic change) |
| `perf` | Performance improvement |

### Scopes

Common scopes: `contracts`, `client`, `server`, `sdk`, `scripts`, `ci`, `docs`

### Examples

```
feat(contracts): add mint_commander function
fix(client): handle wallet disconnect gracefully
docs: update API endpoints in README
test(server): add save/load integration tests
chore(ci): add Rust cache to GitHub Actions
```

## Pull Request Process

1. **Title**: Must follow Conventional Commits format
2. **Description**: Include context, screenshots (if UI change), and test plan
3. **CI**: All checks must pass (lint, typecheck, tests, contracts)
4. **Review**: Request review from at least one maintainer
5. **Changes**: Address review feedback with additional commits
6. **Merge**: Squash commits into one conventional commit on merge

### PR Checklist

Before submitting, ensure:

- [ ] Code follows project conventions (TypeScript strict, no `any`)
- [ ] Tests added/updated for new functionality
- [ ] Documentation updated if needed
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes (zero warnings)
- [ ] `npm run test` passes
- [ ] `npm run contracts:test` passes (if contract changes)
- [ ] No secrets or API keys committed

## Code Conventions

### TypeScript

- Strict mode enabled, no `any` unless explicitly justified with a comment
- Use `interface` over `type` for object shapes
- Prefer `const` over `let`; avoid `var`
- Use optional chaining (`?.`) and nullish coalescing (`??`)

### React (Client)

- Functional components with hooks, no class components
- PascalCase for component files and folders
- camelCase for utility files and hooks
- Barrel exports from `index.ts` files
- Use path alias `@/` for imports from `src/`

### Styling

- Tailwind CSS utility classes for all styling
- Custom CSS only for complex animations in `index.css`
- Dark theme as default, match the game aesthetic

### Smart Contracts (Rust)

- Follow Rust 2021 edition idioms
- All public functions must have doc comments
- Every storage type must have clear serialization attributes
- Tests required for all public functions

## Smart Contract Changes

- Rust contracts live in `contracts/` (Cargo workspace)
- Run `npm run contracts:test` before committing
- Format with `cargo fmt` before committing
- Run `cargo clippy` and address all warnings
- Update deployment scripts if contract interfaces change
- Deploy to testnet and verify before merging

## Testing

- **Unit tests**: Vitest for JS/TS, `#[test]` for Rust
- **Integration tests**: Supertest for API, cross-contract for Rust
- **Run all JS tests**: `npm run test`
- **Run all Rust tests**: `npm run contracts:test`
- **Test a single workspace**: `npm run test --workspace=server`

## Project Structure

```
stellar-wars/
├── client/          Vite + React + Tailwind (port 3000)
├── server/          Express + Prisma + PostgreSQL (port 4000)
├── contracts/       Soroban smart contracts (Rust/WASM)
├── scripts/         Deployment and utility scripts
├── src/stellar/     Shared Stellar SDK wrappers
├── docs/            Architecture and setup documentation
└── narrative/       Story nodes and faction data
```

## Questions?

Open a [Discussion](https://github.com/Escelit/stellar-wars/discussions) or file an issue using the provided templates.
