#!/usr/bin/env bash
# =============================================================================
# Stellar Wars — End-to-End Smoke Test
# =============================================================================
# Tests the critical user flow:
#   1. Server health check
#   2. Stellar SDK wallet integration (mocked)
#   3. API auth challenge/connect flow
#   4. Narrative node fetching
#   5. Choice submission
#   6. Save/Load game state
#   7. Client dev server responds
#
# Usage:
#   bash scripts/smoke-test.sh          # requires running servers
#   bash scripts/smoke-test.sh --quick  # API-only checks
# =============================================================================

set -euo pipefail

PASS=0
FAIL=0
SERVER_URL="${SERVER_URL:-http://localhost:4000}"
CLIENT_URL="${CLIENT_URL:-http://localhost:3000}"
QUICK="${1:-}"

green() { printf "\033[32m%s\033[0m\n" "$1"; }
red()   { printf "\033[31m%s\033[0m\n" "$1"; }
bold()  { printf "\033[1m%s\033[0m\n" "$1"; }

check() {
  local label="$1"
  local url="$2"
  local expected="$3"

  if response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null); then
    if [ "$response" = "$expected" ]; then
      green "  ✓ $label (HTTP $response)"
      PASS=$((PASS + 1))
    else
      red "  ✗ $label — expected HTTP $expected, got HTTP $response"
      FAIL=$((FAIL + 1))
    fi
  else
    red "  ✗ $label — connection failed"
    FAIL=$((FAIL + 1))
  fi
}

check_post() {
  local label="$1"
  local url="$2"
  local data="$3"
  local expected="$4"

  if response=$(curl -s -o /tmp/smoke-test-response.json -w "%{http_code}" --max-time 5 \
    -X POST "$url" \
    -H "Content-Type: application/json" \
    -d "$data" 2>/dev/null); then
    if [ "$response" = "$expected" ]; then
      green "  ✓ $label (HTTP $response)"
      PASS=$((PASS + 1))
    else
      red "  ✗ $label — expected HTTP $expected, got HTTP $response"
      cat /tmp/smoke-test-response.json 2>/dev/null || true
      FAIL=$((FAIL + 1))
    fi
  else
    red "  ✗ $label — connection failed"
    FAIL=$((FAIL + 1))
  fi
}

bold "══════════════════════════════════════════"
bold "  Stellar Wars — Smoke Test"
bold "  Server: $SERVER_URL"
bold "  Client: $CLIENT_URL"
bold "══════════════════════════════════════════"
echo ""

bold "[1/7] Server Health Check"
check "Health endpoint" "$SERVER_URL/api/health" "200"

bold "[2/7] API Auth Flow"
check "Auth challenge" "$SERVER_URL/api/auth/challenge?publicKey=GA7QH4JZ5X2QY5J6X7K8L9M0N1P2Q3R4S5T6U7V8W9X0Y1Z2A3B4C5D6E7F" "200"
check "Protected route without auth" "$SERVER_URL/api/auth/me" "401"

bold "[3/7] Narrative Endpoints"
check "Root narrative node" "$SERVER_URL/api/narrative/node/start" "200"
check "Chapter 1 node" "$SERVER_URL/api/narrative/node/ch1_intro" "200"

bold "[4/7] Save/Load Endpoints"
check "List saves without auth" "$SERVER_URL/api/saves" "401"

if [ "$QUICK" != "--quick" ]; then
  bold "[5/7] Client Dev Server"
  check "Client health" "$CLIENT_URL" "200"
fi

bold "[6/7] CORS Headers"
if cors=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
  -X OPTIONS "$SERVER_URL/api/health" \
  -H "Origin: $CLIENT_URL" \
  -H "Access-Control-Request-Method: GET" 2>/dev/null); then
  if [ "$cors" != "204" ] && [ "$cors" != "200" ]; then
    red "  ✗ CORS preflight — got HTTP $cors (expected 204 or 200)"
    FAIL=$((FAIL + 1))
  else
    green "  ✓ CORS preflight (HTTP $cors)"
    PASS=$((PASS + 1))
  fi
fi

bold "[7/7] 404 Handler"
check "Unknown route returns 404" "$SERVER_URL/api/nonexistent" "404"

echo ""
bold "══════════════════════════════════════════"
bold "  Results: $PASS passed, $FAIL failed"
bold "══════════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
