# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.x     | :white_check_mark: |

## Reporting a Vulnerability

We take the security of Stellar Wars seriously. If you discover a security vulnerability, please do **not** open a public issue.

Instead, send a private report to the project maintainer via one of these methods:

- **GitHub Security Advisory**: Navigate to the repository's "Security" tab and use the "Report a vulnerability" feature
- **Email**: Reach out to the repository owner directly

Please include as much detail as possible, including:

- The type of vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes

You should receive a response within 48 hours. If the issue is confirmed, we will work on a fix and coordinate a responsible disclosure.

## Scope

This security policy covers:

- Smart contract vulnerabilities (MintController, BattleRegistry, Marketplace)
- API authentication and authorization flaws
- Private key or secret exposure risks
- Frontend XSS, CSRF, and other client-side attacks

## Best Practices

- Never commit secrets, API keys, or `S...` secret keys to version control
- Always use environment variables for sensitive configuration
- Smart contract changes should be audited before mainnet deployment
- Run `npm run lint` and `npm run typecheck` before committing
