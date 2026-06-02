#!/usr/bin/env bash
set -euo pipefail

echo "=== Stellar Wars: Deploy Contracts ==="

NETWORK="${STELLAR_NETWORK:-testnet}"
SOURCE="${ISSUER_SECRET_KEY:-}"

if [ -z "$SOURCE" ]; then
  echo "ERROR: ISSUER_SECRET_KEY is not set"
  exit 1
fi

deploy() {
  local contract_dir="$1"
  local label="$2"
  echo ""
  echo "--- Deploying $label ---"
  stellar contract deploy \
    --wasm "contracts/target/wasm32-unknown-unknown/release/${contract_dir}.wasm" \
    --source "$SOURCE" \
    --network "$NETWORK"
}

deploy "mint_controller" "MintController"
deploy "battle_registry" "BattleRegistry"
deploy "marketplace" "Marketplace"

echo ""
echo "=== Deployment complete ==="
echo "Copy the contract IDs above into your .env file."
