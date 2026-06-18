#!/usr/bin/env bash
set -euo pipefail

echo "=== Stellar Wars: Deploy Contracts ==="
echo ""

NETWORK="${STELLAR_NETWORK:-testnet}"
SOURCE="${ISSUER_SECRET_KEY:-}"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [ -z "$SOURCE" ]; then
  echo "ERROR: ISSUER_SECRET_KEY is not set"
  echo ""
  echo "  export ISSUER_SECRET_KEY=S...</YOUR SECRET KEY>"
  exit 1
fi

WASM_DIR="$ROOT_DIR/contracts/target/wasm32-unknown-unknown/release"

# Check all contracts first, then build once if any missing
all_exist=true
for name in mint_controller battle_registry marketplace; do
  if [ ! -f "$WASM_DIR/${name}.wasm" ]; then
    all_exist=false
    break
  fi
done

if [ "$all_exist" = false ]; then
  echo "-> Building contracts..."
  (cd "$ROOT_DIR/contracts" && cargo build --target wasm32-unknown-unknown --release 2>&1)
  echo ""
fi

declare -A CONTRACT_IDS

deploy() {
  local contract_dir="$1"
  local label="$2"
  local wasm_path="$WASM_DIR/${contract_dir}.wasm"

  if [ ! -f "$wasm_path" ]; then
    echo "ERROR: WASM file not found at $wasm_path"
    exit 1
  fi

  echo "--- Deploying $label ---"
  local output
  output=$(stellar contract deploy \
    --wasm "$wasm_path" \
    --source "$SOURCE" \
    --network "$NETWORK" \
    2>&1 | tail -1)

  echo "$output"
  CONTRACT_IDS["$label"]="$output"
  echo ""
}

deploy "mint_controller" "MINT_CONTROLLER"
deploy "battle_registry" "BATTLE_REGISTRY"
deploy "marketplace" "MARKETPLACE"

echo "=== Deployment complete ==="
echo ""
echo "Add these to your .env file:"
echo ""
for key in MINT_CONTROLLER BATTLE_REGISTRY MARKETPLACE; do
  echo "  ${key}_CONTRACT=${CONTRACT_IDS[$key]}"
done
echo ""
echo "Or run:"
echo ""
for key in MINT_CONTROLLER BATTLE_REGISTRY MARKETPLACE; do
  echo "  export ${key}_CONTRACT=${CONTRACT_IDS[$key]}"
done
echo ""
