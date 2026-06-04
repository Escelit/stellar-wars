use soroban_sdk::{contract, contractimpl, contracttype, log, vec, Address, Env, String, Vec};

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum BattleStrategy {
    Aggressive,
    Defensive,
    Balanced,
    Guerilla,
    Diplomatic,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum BattleOutcome {
    Victory,
    Defeat,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct CommanderStats {
    pub total_battles: u32,
    pub wins: u32,
    pub losses: u32,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct BattleRecord {
    pub id: u32,
    pub player: Address,
    pub commander_id: u32,
    pub opponent_name: String,
    pub strategy: BattleStrategy,
    pub outcome: BattleOutcome,
    pub timestamp: u64,
    pub morale_before: i32,
    pub morale_after: i32,
    pub player_stats: Vec<u32>,
    pub opponent_stats: Vec<u32>,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Paused,
    NextBattleId,
    Battle(u32),
    PlayerBattles(Address),
    CommanderStatsKey(u32),
}

#[contract]
pub struct BattleRegistry;

#[contractimpl]
impl BattleRegistry {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Paused, &false);
        env.storage().instance().set(&DataKey::NextBattleId, &1u32);
        log!(&env, "BattleRegistry initialized with admin: {}", admin);
    }

    pub fn record_battle(
        env: Env,
        player: Address,
        commander_id: u32,
        opponent_name: String,
        strategy: BattleStrategy,
        outcome: BattleOutcome,
        morale_before: i32,
        player_stats: Vec<u32>,
        opponent_stats: Vec<u32>,
    ) -> BattleRecord {
        if Self::is_paused_internal(&env) {
            panic!("contract is paused");
        }
        player.require_auth();

        let morale_after = match &outcome {
            BattleOutcome::Victory => {
                if morale_before == 0 { 0 } else { morale_before + 5 }
            }
            BattleOutcome::Defeat => {
                if morale_before == 0 { 0 } else { morale_before - 10 }
            }
        };

        let id = Self::next_battle_id(&env);
        let timestamp = env.ledger().timestamp();

        let record = BattleRecord {
            id,
            player: player.clone(),
            commander_id,
            opponent_name,
            strategy,
            outcome,
            timestamp,
            morale_before,
            morale_after,
            player_stats,
            opponent_stats,
        };

        env.storage()
            .instance()
            .set(&DataKey::Battle(id), &record);
        Self::add_to_player_battles(&env, &player, id);
        Self::update_commander_stats(&env, commander_id, &record.outcome);

        log!(
            &env,
            "Recorded battle {} for commander {} (outcome: {:?}, morale: {} -> {})",
            id, commander_id, record.outcome, morale_before, morale_after
        );
        record
    }

    pub fn get_battle(env: Env, battle_id: u32) -> Option<BattleRecord> {
        env.storage()
            .instance()
            .get(&DataKey::Battle(battle_id))
    }

    pub fn get_player_battles(env: Env, player: Address) -> Vec<BattleRecord> {
        let ids = Self::get_player_battle_ids(&env, &player);
        let mut result: Vec<BattleRecord> = vec![&env];
        for i in 0..ids.len() {
            if let Some(record) = env
                .storage()
                .instance()
                .get(&DataKey::Battle(ids.get(i).unwrap()))
            {
                result.push_back(record);
            }
        }
        result
    }

    pub fn get_commander_stats(env: Env, commander_id: u32) -> Option<CommanderStats> {
        env.storage()
            .instance()
            .get(&DataKey::CommanderStatsKey(commander_id))
    }

    pub fn pause(env: Env) {
        let admin = Self::get_admin(&env);
        admin.require_auth();
        env.storage().instance().set(&DataKey::Paused, &true);
        log!(&env, "BattleRegistry paused");
    }

    pub fn unpause(env: Env) {
        let admin = Self::get_admin(&env);
        admin.require_auth();
        env.storage().instance().set(&DataKey::Paused, &false);
        log!(&env, "BattleRegistry unpaused");
    }

    pub fn is_paused(env: &Env) -> bool {
        Self::is_paused_internal(env)
    }

    fn is_paused_internal(env: &Env) -> bool {
        env.storage()
            .instance()
            .get(&DataKey::Paused)
            .unwrap_or(false)
    }

    fn get_admin(env: &Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("not initialized")
    }

    fn next_battle_id(env: &Env) -> u32 {
        let id: u32 = env
            .storage()
            .instance()
            .get(&DataKey::NextBattleId)
            .expect("not initialized");
        env.storage()
            .instance()
            .set(&DataKey::NextBattleId, &(id + 1));
        id
    }

    fn get_player_battle_ids(env: &Env, player: &Address) -> Vec<u32> {
        env.storage()
            .instance()
            .get(&DataKey::PlayerBattles(player.clone()))
            .unwrap_or_else(|| vec![&env])
    }

    fn add_to_player_battles(env: &Env, player: &Address, id: u32) {
        let mut ids = Self::get_player_battle_ids(env, player);
        ids.push_back(id);
        env.storage()
            .instance()
            .set(&DataKey::PlayerBattles(player.clone()), &ids);
    }

    fn update_commander_stats(env: &Env, commander_id: u32, outcome: &BattleOutcome) {
        let mut stats: CommanderStats = env
            .storage()
            .instance()
            .get(&DataKey::CommanderStatsKey(commander_id))
            .unwrap_or(CommanderStats {
                total_battles: 0,
                wins: 0,
                losses: 0,
            });

        stats.total_battles += 1;
        match outcome {
            BattleOutcome::Victory => stats.wins += 1,
            BattleOutcome::Defeat => stats.losses += 1,
        }

        env.storage()
            .instance()
            .set(&DataKey::CommanderStatsKey(commander_id), &stats);
    }
}
