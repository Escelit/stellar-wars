/**
 * Stellar Network Constants
 */

export const NETWORK_PASSPHRASE = {
  TESTNET: 'Test SDF Network ; September 2015',
  MAINNET: 'Public Global Stellar Network ; September 2015',
};

export const HORIZON_URL = {
  TESTNET: 'https://horizon-testnet.stellar.org',
  MAINNET: 'https://horizon.stellar.org',
};

export const SOROBAN_RPC_URL = {
  TESTNET: 'https://soroban-testnet.stellar.org',
  MAINNET: 'https://soroban-rpc.stellar.org',
};

// Contract IDs should be updated after deployment
export const CONTRACT_IDS = {
  MINT_CONTROLLER: process.env.MINT_CONTROLLER_CONTRACT || '',
  BATTLE_REGISTRY: process.env.BATTLE_REGISTRY_CONTRACT || '',
  MARKETPLACE: process.env.MARKETPLACE_CONTRACT || '',
};

export const DEFAULT_NETWORK = 'TESTNET';
