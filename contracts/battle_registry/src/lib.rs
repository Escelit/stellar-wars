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

#[cfg(test)]
mod test {
    use super::{
        BattleOutcome, BattleRegistry, BattleRegistryClient, BattleStrategy,
    };
    use soroban_sdk::{
        self, vec,
        testutils::{Address as _, Ledger},
        Address, Env, String,
    };

    fn setup() -> (Env, BattleRegistryClient<'static>, Address, Address) {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let player = Address::generate(&env);
        let contract_id = env.register(BattleRegistry, ());
        let client = BattleRegistryClient::new(&env, &contract_id);
        client.initialize(&admin);
        (env, client, admin, player)
    }

    #[test]
    fn test_initialize() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let contract_id = env.register(BattleRegistry, ());
        let client = BattleRegistryClient::new(&env, &contract_id);
        client.initialize(&admin);
        assert!(!client.is_paused());
    }

    #[test]
    #[should_panic(expected = "already initialized")]
    fn test_initialize_twice() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let contract_id = env.register(BattleRegistry, ());
        let client = BattleRegistryClient::new(&env, &contract_id);
        client.initialize(&admin);
        client.initialize(&admin);
    }

    #[test]
    fn test_record_battle_victory() {
        let (env, client, _admin, player) = setup();
        env.ledger().set_timestamp(2000);

        let player_stats = vec![&env, 80u32, 70u32, 60u32, 50u32, 90u32];
        let opponent_stats = vec![&env, 60u32, 60u32, 60u32, 60u32, 60u32];

        let record = client.record_battle(
            &player,
            &1u32,
            &String::from_str(&env, "Xenon"),
            &BattleStrategy::Aggressive,
            &BattleOutcome::Victory,
            &100i32,
            &player_stats,
            &opponent_stats,
        );

        assert_eq!(record.id, 1);
        assert_eq!(record.player, player);
        assert_eq!(record.commander_id, 1);
        assert_eq!(record.opponent_name, String::from_str(&env, "Xenon"));
        assert_eq!(record.strategy, BattleStrategy::Aggressive);
        assert_eq!(record.outcome, BattleOutcome::Victory);
        assert_eq!(record.timestamp, 2000);
        assert_eq!(record.morale_before, 100);
        assert_eq!(record.morale_after, 105);
        assert_eq!(record.player_stats, player_stats);
        assert_eq!(record.opponent_stats, opponent_stats);
    }

    #[test]
    fn test_record_battle_defeat() {
        let (env, client, _admin, player) = setup();
        env.ledger().set_timestamp(3000);

        let player_stats = vec![&env, 80u32, 70u32, 60u32, 50u32, 90u32];
        let opponent_stats = vec![&env, 90u32, 90u32, 90u32, 90u32, 90u32];

        let record = client.record_battle(
            &player,
            &1u32,
            &String::from_str(&env, "Nova"),
            &BattleStrategy::Defensive,
            &BattleOutcome::Defeat,
            &100i32,
            &player_stats,
            &opponent_stats,
        );

        assert_eq!(record.id, 1);
        assert_eq!(record.morale_before, 100);
        assert_eq!(record.morale_after, 90);
    }

    #[test]
    fn test_record_battle_fallen_commander() {
        let (env, client, _admin, player) = setup();

        let player_stats = vec![&env, 80u32, 70u32, 60u32, 50u32, 90u32];
        let opponent_stats = vec![&env, 90u32, 90u32, 90u32, 90u32, 90u32];

        let record = client.record_battle(
            &player,
            &1u32,
            &String::from_str(&env, "Nova"),
            &BattleStrategy::Balanced,
            &BattleOutcome::Defeat,
            &0i32,
            &player_stats,
            &opponent_stats,
        );

        assert_eq!(record.morale_after, 0);
    }

    #[test]
    fn test_get_battle() {
        let (env, client, _admin, player) = setup();

        let player_stats = vec![&env, 80u32, 70u32, 60u32, 50u32, 90u32];
        let opponent_stats = vec![&env, 60u32, 60u32, 60u32, 60u32, 60u32];

        client.record_battle(
            &player,
            &1u32,
            &String::from_str(&env, "Xenon"),
            &BattleStrategy::Aggressive,
            &BattleOutcome::Victory,
            &100i32,
            &player_stats,
            &opponent_stats,
        );

        let record = client.get_battle(&1).expect("battle should exist");
        assert_eq!(record.id, 1);
        assert_eq!(record.morale_after, 105);
    }

    #[test]
    fn test_get_battle_nonexistent() {
        let (_env, client, _admin, _player) = setup();
        let result = client.get_battle(&999);
        assert!(result.is_none());
    }

    #[test]
    fn test_get_player_battles() {
        let (env, client, _admin, player) = setup();

        let player_stats_1 = vec![&env, 80u32, 70u32, 60u32, 50u32, 90u32];
        let player_stats_2 = vec![&env, 50u32, 60u32, 70u32, 80u32, 90u32];

        client.record_battle(
            &player,
            &1u32,
            &String::from_str(&env, "Xenon"),
            &BattleStrategy::Aggressive,
            &BattleOutcome::Victory,
            &100i32,
            &player_stats_1,
            &vec![&env, 60u32, 60u32, 60u32, 60u32, 60u32],
        );

        client.record_battle(
            &player,
            &1u32,
            &String::from_str(&env, "Nova"),
            &BattleStrategy::Defensive,
            &BattleOutcome::Defeat,
            &105i32,
            &player_stats_2,
            &vec![&env, 90u32, 90u32, 90u32, 90u32, 90u32],
        );

        let battles = client.get_player_battles(&player);
        assert_eq!(battles.len(), 2);
        assert_eq!(battles.get(0).unwrap().id, 1);
        assert_eq!(battles.get(1).unwrap().id, 2);
    }

    #[test]
    fn test_get_player_battles_empty() {
        let (env, client, _admin, player) = setup();
        let other = Address::generate(&env);

        let player_stats = vec![&env, 80u32, 70u32, 60u32, 50u32, 90u32];
        client.record_battle(
            &player,
            &1u32,
            &String::from_str(&env, "Xenon"),
            &BattleStrategy::Aggressive,
            &BattleOutcome::Victory,
            &100i32,
            &player_stats,
            &vec![&env, 60u32, 60u32, 60u32, 60u32, 60u32],
        );

        let other_battles = client.get_player_battles(&other);
        assert_eq!(other_battles.len(), 0);
    }

    #[test]
    fn test_get_commander_stats() {
        let (env, client, _admin, player) = setup();

        let player_stats = vec![&env, 80u32, 70u32, 60u32, 50u32, 90u32];

        client.record_battle(
            &player,
            &1u32,
            &String::from_str(&env, "Xenon"),
            &BattleStrategy::Aggressive,
            &BattleOutcome::Victory,
            &100i32,
            &player_stats,
            &vec![&env, 60u32, 60u32, 60u32, 60u32, 60u32],
        );

        client.record_battle(
            &player,
            &1u32,
            &String::from_str(&env, "Nova"),
            &BattleStrategy::Defensive,
            &BattleOutcome::Victory,
            &105i32,
            &player_stats,
            &vec![&env, 70u32, 70u32, 70u32, 70u32, 70u32],
        );

        client.record_battle(
            &player,
            &1u32,
            &String::from_str(&env, "Zara"),
            &BattleStrategy::Balanced,
            &BattleOutcome::Defeat,
            &110i32,
            &player_stats,
            &vec![&env, 90u32, 90u32, 90u32, 90u32, 90u32],
        );

        let stats = client
            .get_commander_stats(&1)
            .expect("stats should exist");
        assert_eq!(stats.total_battles, 3);
        assert_eq!(stats.wins, 2);
        assert_eq!(stats.losses, 1);
    }

    #[test]
    fn test_get_commander_stats_nonexistent() {
        let (_env, client, _admin, _player) = setup();
        let result = client.get_commander_stats(&999);
        assert!(result.is_none());
    }

    #[test]
    fn test_multiple_commanders_stats() {
        let (env, client, _admin, player) = setup();

        let player_stats = vec![&env, 80u32, 70u32, 60u32, 50u32, 90u32];

        client.record_battle(
            &player,
            &1u32,
            &String::from_str(&env, "Xenon"),
            &BattleStrategy::Aggressive,
            &BattleOutcome::Victory,
            &100i32,
            &player_stats,
            &vec![&env, 60u32, 60u32, 60u32, 60u32, 60u32],
        );

        client.record_battle(
            &player,
            &2u32,
            &String::from_str(&env, "Nova"),
            &BattleStrategy::Defensive,
            &BattleOutcome::Defeat,
            &100i32,
            &player_stats,
            &vec![&env, 90u32, 90u32, 90u32, 90u32, 90u32],
        );

        let stats1 = client.get_commander_stats(&1).unwrap();
        assert_eq!(stats1.total_battles, 1);
        assert_eq!(stats1.wins, 1);
        assert_eq!(stats1.losses, 0);

        let stats2 = client.get_commander_stats(&2).unwrap();
        assert_eq!(stats2.total_battles, 1);
        assert_eq!(stats2.wins, 0);
        assert_eq!(stats2.losses, 1);
    }

    #[test]
    fn test_pause_unpause() {
        let (_env, client, _admin, _player) = setup();
        assert!(!client.is_paused());
        client.pause();
        assert!(client.is_paused());
        client.unpause();
        assert!(!client.is_paused());
    }

    #[test]
    #[should_panic(expected = "contract is paused")]
    fn test_record_battle_when_paused() {
        let (env, client, _admin, player) = setup();
        client.pause();

        let player_stats = vec![&env, 80u32, 70u32, 60u32, 50u32, 90u32];
        client.record_battle(
            &player,
            &1u32,
            &String::from_str(&env, "Xenon"),
            &BattleStrategy::Aggressive,
            &BattleOutcome::Victory,
            &100i32,
            &player_stats,
            &vec![&env, 60u32, 60u32, 60u32, 60u32, 60u32],
        );
    }

    #[test]
    fn test_morale_multiple_battles() {
        let (env, client, _admin, player) = setup();

        let player_stats = vec![&env, 80u32, 70u32, 60u32, 50u32, 90u32];
        let weak_opponent = vec![&env, 40u32, 40u32, 40u32, 40u32, 40u32];
        let strong_opponent = vec![&env, 95u32, 95u32, 95u32, 95u32, 95u32];

        // Battle 1: victory, morale goes from 100 -> 105
        let r1 = client.record_battle(
            &player, &1u32, &String::from_str(&env, "Alpha"),
            &BattleStrategy::Aggressive, &BattleOutcome::Victory, &100i32,
            &player_stats, &weak_opponent,
        );
        assert_eq!(r1.morale_after, 105);

        // Battle 2: defeat, morale goes from 105 -> 95
        let r2 = client.record_battle(
            &player, &1u32, &String::from_str(&env, "Beta"),
            &BattleStrategy::Defensive, &BattleOutcome::Defeat, &105i32,
            &player_stats, &strong_opponent,
        );
        assert_eq!(r2.morale_after, 95);
    }

    #[test]
    fn test_battle_record_all_strategies() {
        let (env, client, _admin, player) = setup();

        let player_stats = vec![&env, 80u32, 70u32, 60u32, 50u32, 90u32];
        let opponent_stats = vec![&env, 60u32, 60u32, 60u32, 60u32, 60u32];
        let strategies = [
            BattleStrategy::Aggressive,
            BattleStrategy::Defensive,
            BattleStrategy::Balanced,
            BattleStrategy::Guerilla,
            BattleStrategy::Diplomatic,
        ];

        for (i, strategy) in strategies.iter().enumerate() {
            let record = client.record_battle(
                &player,
                &((i + 1) as u32),
                &String::from_str(&env, "Opponent"),
                strategy,
                &BattleOutcome::Victory,
                &100i32,
                &player_stats,
                &opponent_stats,
            );
            assert_eq!(record.strategy, *strategy);
        }
    }
}
