#!/usr/bin/env bash
set -euo pipefail

echo "=== Stellar Wars: Testnet Setup ==="
echo ""

PUBLIC_KEY="${ISSUER_PUBLIC_KEY:-}"

if [ -z "$PUBLIC_KEY" ]; then
  echo "ERROR: ISSUER_PUBLIC_KEY is not set"
  echo ""
  echo "  export ISSUER_PUBLIC_KEY=G...<YOUR PUBLIC KEY>"
  exit 1
fi

echo "Funding $PUBLIC_KEY via Friendbot..."
echo ""

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://friendbot.stellar.org?addr=$PUBLIC_KEY")

if [ "$HTTP_CODE" = "200" ]; then
  echo "Account funded successfully!"
else
  echo "WARNING: Friendbot returned HTTP $HTTP_CODE"
  echo "The account may already be funded. Try checking the Stellar testnet explorer."
fi

echo ""
echo "=== Setup complete ==="
