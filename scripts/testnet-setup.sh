#!/usr/bin/env bash
set -euo pipefail

echo "=== Stellar Wars: Testnet Setup ==="

PUBLIC_KEY="${ISSUER_PUBLIC_KEY:-}"

if [ -z "$PUBLIC_KEY" ]; then
  echo "ERROR: ISSUER_PUBLIC_KEY is not set"
  exit 1
fi

echo "Funding $PUBLIC_KEY via Friendbot..."
curl -s "https://friendbot.stellar.org?addr=$PUBLIC_KEY" | jq .

echo ""
echo "=== Account funded ==="
