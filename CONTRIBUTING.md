# Contributing to Stellar Wars

Thank you for your interest in contributing! This document outlines the process.

## Code of Conduct

All contributors must adhere to our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone git@github.com:your-username/stellar-wars.git`
3. Set up the project: `npm install && cp .env.example .env`
4. Start PostgreSQL: `docker compose up -d`
5. Run database migrations: `npm run db:migrate`
6. Start the dev servers: `npm run dev`

## Development Workflow

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Make your changes
3. Run all checks: `npm run typecheck && npm run lint && npm run test`
4. Commit using Conventional Commits (see below)
5. Push and open a Pull Request

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `perf`

Examples:
- `feat(contracts): add mint_commander function`
- `fix(client): handle wallet disconnect gracefully`
- `docs: update API endpoints in README`

## Pull Request Process

1. Ensure CI passes (lint, typecheck, tests)
2. Update documentation if needed
3. Add tests for new functionality
4. Request review from maintainers
5. Squash commits on merge

## Project Structure

See the `Project Structure` section in [README.md](README.md).

## Smart Contract Changes

- Rust contracts live in `contracts/`
- Run `npm run contracts:test` before committing
- Update deployment scripts if contract interfaces change
- Deploy to testnet and verify before merging

## Questions?

Open a [Discussion](https://github.com/Escelit/stellar-wars/discussions) or file an issue.
