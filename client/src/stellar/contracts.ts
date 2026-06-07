import { nativeToScVal, xdr } from '@stellar/stellar-sdk';
import { CONTRACT_IDS } from './config';
import { simulateContractCall, parseContractResult } from './soroban';

// --- Types ---

export enum Rarity {
  Common = 0,
  Uncommon = 1,
  Rare = 2,
  Epic = 3,
  Legendary = 4,
}

export interface Commander {
  id: number;
  name: string;
  rarity: Rarity;
  faction: string;
  stats: number[];
  owner: string;
  is_fallen: boolean;
  morale: number;
  minted_at: number;
}

export enum BattleStrategy {
  Aggressive = 0,
  Defensive = 1,
  Balanced = 2,
  Guerilla = 3,
  Diplomatic = 4,
}

export enum BattleOutcome {
  Victory = 0,
  Defeat = 1,
}

export interface BattleRecord {
  id: number;
  player: string;
  commander_id: number;
  opponent_name: string;
  strategy: BattleStrategy;
  outcome: BattleOutcome;
  timestamp: number;
  morale_before: number;
  morale_after: number;
  player_stats: number[];
  opponent_stats: number[];
}

export interface CommanderStats {
  total_battles: number;
  wins: number;
  losses: number;
}

export interface Listing {
  id: number;
  seller: string;
  commander_id: number;
  price: bigint;
  is_active: boolean;
  created_at: number;
}

// --- Contract Clients ---

export const mintController = {
  async getCommander(commanderId: number): Promise<Commander | null> {
    const result = await simulateContractCall({
      contractId: CONTRACT_IDS.MINT_CONTROLLER,
      method: 'get_commander',
      args: [nativeToScVal(commanderId, { type: 'u32' })],
      source: CONTRACT_IDS.MINT_CONTROLLER, // Use contract ID as source for read-only if no wallet
    });
    return parseContractResult(result as any) as Commander | null;
  },

  async getOwnedCommanders(owner: string): Promise<Commander[]> {
    const result = await simulateContractCall({
      contractId: CONTRACT_IDS.MINT_CONTROLLER,
      method: 'get_owned_commanders',
      args: [nativeToScVal(owner, { type: 'address' })],
      source: owner,
    });
    return (parseContractResult(result as any) as Commander[]) || [];
  },
};

export const battleRegistry = {
  async getBattle(battleId: number): Promise<BattleRecord | null> {
    const result = await simulateContractCall({
      contractId: CONTRACT_IDS.BATTLE_REGISTRY,
      method: 'get_battle',
      args: [nativeToScVal(battleId, { type: 'u32' })],
      source: CONTRACT_IDS.BATTLE_REGISTRY,
    });
    return parseContractResult(result as any) as BattleRecord | null;
  },

  async getPlayerBattles(player: string): Promise<BattleRecord[]> {
    const result = await simulateContractCall({
      contractId: CONTRACT_IDS.BATTLE_REGISTRY,
      method: 'get_player_battles',
      args: [nativeToScVal(player, { type: 'address' })],
      source: player,
    });
    return (parseContractResult(result as any) as BattleRecord[]) || [];
  },

  async getCommanderStats(commanderId: number): Promise<CommanderStats | null> {
    const result = await simulateContractCall({
      contractId: CONTRACT_IDS.BATTLE_REGISTRY,
      method: 'get_commander_stats',
      args: [nativeToScVal(commanderId, { type: 'u32' })],
      source: CONTRACT_IDS.BATTLE_REGISTRY,
    });
    return parseContractResult(result as any) as CommanderStats | null;
  },
};

export const marketplace = {
  async getListing(listingId: number): Promise<Listing | null> {
    const result = await simulateContractCall({
      contractId: CONTRACT_IDS.MARKETPLACE,
      method: 'get_listing',
      args: [nativeToScVal(listingId, { type: 'u32' })],
      source: CONTRACT_IDS.MARKETPLACE,
    });
    return parseContractResult(result as any) as Listing | null;
  },

  async getCommanderListing(commanderId: number): Promise<Listing | null> {
    const result = await simulateContractCall({
      contractId: CONTRACT_IDS.MARKETPLACE,
      method: 'get_commander_listing',
      args: [nativeToScVal(commanderId, { type: 'u32' })],
      source: CONTRACT_IDS.MARKETPLACE,
    });
    return parseContractResult(result as any) as Listing | null;
  },

  async getSellerListings(seller: string): Promise<Listing[]> {
    const result = await simulateContractCall({
      contractId: CONTRACT_IDS.MARKETPLACE,
      method: 'get_seller_listings',
      args: [nativeToScVal(seller, { type: 'address' })],
      source: seller,
    });
    return (parseContractResult(result as any) as Listing[]) || [];
  },
};

// --- Transaction Preparation Helpers ---

export const contractActions = {
  mintCommander(owner: string, name: string, rarity: Rarity, faction: string, stats: number[]) {
    return {
      contractId: CONTRACT_IDS.MINT_CONTROLLER,
      method: 'mint_commander',
      args: [
        nativeToScVal(owner, { type: 'address' }),
        nativeToScVal(name, { type: 'string' }),
        nativeToScVal(rarity, { type: 'u32' }), // Enums are u32
        nativeToScVal(faction, { type: 'string' }),
        nativeToScVal(stats, { type: 'vec', children: { type: 'u32' } }),
      ],
    };
  },

  recordBattle(
    player: string,
    commanderId: number,
    opponentName: string,
    strategy: BattleStrategy,
    outcome: BattleOutcome,
    moraleBefore: number,
    playerStats: number[],
    opponentStats: number[]
  ) {
    return {
      contractId: CONTRACT_IDS.BATTLE_REGISTRY,
      method: 'record_battle',
      args: [
        nativeToScVal(player, { type: 'address' }),
        nativeToScVal(commanderId, { type: 'u32' }),
        nativeToScVal(opponentName, { type: 'string' }),
        nativeToScVal(strategy, { type: 'u32' }),
        nativeToScVal(outcome, { type: 'u32' }),
        nativeToScVal(moraleBefore, { type: 'i32' }),
        nativeToScVal(playerStats, { type: 'vec', children: { type: 'u32' } }),
        nativeToScVal(opponentStats, { type: 'vec', children: { type: 'u32' } }),
      ],
    };
  },

  listCommander(seller: string, commanderId: number, price: bigint) {
    return {
      contractId: CONTRACT_IDS.MARKETPLACE,
      method: 'list_commander',
      args: [
        nativeToScVal(seller, { type: 'address' }),
        nativeToScVal(commanderId, { type: 'u32' }),
        nativeToScVal(price, { type: 'i128' }),
      ],
    };
  },

  buyCommander(buyer: string, listingId: number) {
    return {
      contractId: CONTRACT_IDS.MARKETPLACE,
      method: 'buy_commander',
      args: [
        nativeToScVal(buyer, { type: 'address' }),
        nativeToScVal(listingId, { type: 'u32' }),
      ],
    };
  },
};
