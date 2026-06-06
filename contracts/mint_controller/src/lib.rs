use soroban_sdk::{
    contract, contractimpl, contracttype, log, vec, Address, Env, String, Vec,
};

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum Rarity {
    Common,
    Uncommon,
    Rare,
    Epic,
    Legendary,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Commander {
    pub id: u32,
    pub name: String,
    pub rarity: Rarity,
    pub faction: String,
    pub stats: Vec<u32>,
    pub owner: Address,
    pub is_fallen: bool,
    pub morale: i32,
    pub minted_at: u64,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Paused,
    NextId,
    Commander(u32),
    OwnedCommanders(Address),
}

const MAX_STAT: u32 = 100;
const STAT_COUNT: u32 = 5;

#[contract]
pub struct MintController;

#[contractimpl]
impl MintController {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Paused, &false);
        env.storage().instance().set(&DataKey::NextId, &1u32);
        log!(&env, "MintController initialized with admin: {}", admin);
    }

    pub fn mint_commander(
        env: Env,
        owner: Address,
        name: String,
        rarity: Rarity,
        faction: String,
        stats: Vec<u32>,
    ) -> Commander {
        if Self::is_paused_internal(&env) {
            panic!("contract is paused");
        }
        owner.require_auth();

        if stats.len() != STAT_COUNT {
            panic!("stats must have exactly 5 values");
        }
        for i in 0..stats.len() {
            if stats.get(i).unwrap() > MAX_STAT {
                panic!("stat value exceeds maximum");
            }
        }
        if name.len() == 0 {
            panic!("name cannot be empty");
        }
        if faction.len() == 0 {
            panic!("faction cannot be empty");
        }

        let id = Self::next_id(&env);
        let minted_at = env.ledger().timestamp();

        let commander = Commander {
            id,
            name,
            rarity,
            faction,
            stats,
            owner: owner.clone(),
            is_fallen: false,
            morale: 100,
            minted_at,
        };

        env.storage()
            .instance()
            .set(&DataKey::Commander(id), &commander);
        Self::add_to_owned(&env, &owner, id);

        log!(&env, "Minted commander {} for owner {}", id, owner);
        commander
    }

    pub fn transfer(env: Env, commander_id: u32, to: Address) {
        if Self::is_paused_internal(&env) {
            panic!("contract is paused");
        }
        to.require_auth();

        let mut commander = Self::get_commander_data(&env, commander_id);
        let current_owner = commander.owner.clone();
        current_owner.require_auth();

        Self::remove_from_owned(&env, &current_owner, commander_id);
        commander.owner = to.clone();
        env.storage()
            .instance()
            .set(&DataKey::Commander(commander_id), &commander);
        Self::add_to_owned(&env, &to, commander_id);

        log!(
            &env,
            "Transferred commander {} from {} to {}",
            commander_id,
            current_owner,
            to
        );
    }

    pub fn mark_fallen(env: Env, commander_id: u32) {
        let admin = Self::get_admin(&env);
        admin.require_auth();

        let mut commander = Self::get_commander_data(&env, commander_id);
        commander.is_fallen = true;
        commander.morale = 0;
        env.storage()
            .instance()
            .set(&DataKey::Commander(commander_id), &commander);

        log!(&env, "Commander {} marked as fallen", commander_id);
    }

    pub fn get_commander(env: Env, commander_id: u32) -> Option<Commander> {
        env.storage()
            .instance()
            .get(&DataKey::Commander(commander_id))
    }

    pub fn get_owned_commanders(env: Env, owner: Address) -> Vec<Commander> {
        let ids = Self::get_owned_ids(&env, &owner);
        let mut result: Vec<Commander> = vec![&env];
        for i in 0..ids.len() {
            if let Some(cmd) = env
                .storage()
                .instance()
                .get(&DataKey::Commander(ids.get(i).unwrap()))
            {
                result.push_back(cmd);
            }
        }
        result
    }

    pub fn pause(env: Env) {
        let admin = Self::get_admin(&env);
        admin.require_auth();
        env.storage().instance().set(&DataKey::Paused, &true);
        log!(&env, "Contract paused");
    }

    pub fn unpause(env: Env) {
        let admin = Self::get_admin(&env);
        admin.require_auth();
        env.storage().instance().set(&DataKey::Paused, &false);
        log!(&env, "Contract unpaused");
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

    fn next_id(env: &Env) -> u32 {
        let id: u32 = env
            .storage()
            .instance()
            .get(&DataKey::NextId)
            .expect("not initialized");
        env.storage().instance().set(&DataKey::NextId, &(id + 1));
        id
    }

    fn get_commander_data(env: &Env, commander_id: u32) -> Commander {
        env.storage()
            .instance()
            .get(&DataKey::Commander(commander_id))
            .expect("commander not found")
    }

    fn get_owned_ids(env: &Env, owner: &Address) -> Vec<u32> {
        env.storage()
            .instance()
            .get(&DataKey::OwnedCommanders(owner.clone()))
            .unwrap_or_else(|| vec![&env])
    }

    fn add_to_owned(env: &Env, owner: &Address, id: u32) {
        let mut ids = Self::get_owned_ids(env, owner);
        ids.push_back(id);
        env.storage()
            .instance()
            .set(&DataKey::OwnedCommanders(owner.clone()), &ids);
    }

    fn remove_from_owned(env: &Env, owner: &Address, id: u32) {
        let ids = Self::get_owned_ids(env, owner);
        let mut new_ids: Vec<u32> = vec![&env];
        for i in 0..ids.len() {
            let current = ids.get(i).unwrap();
            if current != id {
                new_ids.push_back(current);
            }
        }
        env.storage()
            .instance()
            .set(&DataKey::OwnedCommanders(owner.clone()), &new_ids);
    }
}

#[cfg(test)]
mod test {
    use super::{MintController, MintControllerClient, Rarity};
    use soroban_sdk::{
        self, vec,
        testutils::{Address as _, Ledger},
        Address, Env, String,
    };

    fn setup() -> (Env, MintControllerClient<'static>, Address, Address) {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let owner = Address::generate(&env);
        let contract_id = env.register(MintController, ());
        let client = MintControllerClient::new(&env, &contract_id);
        client.initialize(&admin);
        (env, client, admin, owner)
    }

    #[test]
    fn test_initialize() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let contract_id = env.register(MintController, ());
        let client = MintControllerClient::new(&env, &contract_id);
        client.initialize(&admin);
        assert!(!client.is_paused());
    }

    #[test]
    #[should_panic(expected = "already initialized")]
    fn test_initialize_twice() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let contract_id = env.register(MintController, ());
        let client = MintControllerClient::new(&env, &contract_id);
        client.initialize(&admin);
        client.initialize(&admin);
    }

    #[test]
    fn test_mint_commander() {
        let (env, client, _admin, owner) = setup();
        env.ledger().set_timestamp(1000);

        let stats = vec![&env, 80u32, 70u32, 60u32, 50u32, 90u32];
        let commander = client.mint_commander(
            &owner,
            &String::from_str(&env, "Atlas"),
            &Rarity::Rare,
            &String::from_str(&env, "Terra"),
            &stats,
        );

        assert_eq!(commander.id, 1);
        assert_eq!(commander.name, String::from_str(&env, "Atlas"));
        assert_eq!(commander.rarity, Rarity::Rare);
        assert_eq!(commander.faction, String::from_str(&env, "Terra"));
        assert_eq!(commander.stats, stats);
        assert_eq!(commander.owner, owner);
        assert!(!commander.is_fallen);
        assert_eq!(commander.morale, 100);
        assert_eq!(commander.minted_at, 1000);
    }

    #[test]
    fn test_mint_multiple_commanders() {
        let (env, client, _admin, owner) = setup();

        let stats1 = vec![&env, 80u32, 70u32, 60u32, 50u32, 90u32];
        let stats2 = vec![&env, 50u32, 60u32, 70u32, 80u32, 90u32];

        let c1 = client.mint_commander(
            &owner,
            &String::from_str(&env, "Atlas"),
            &Rarity::Rare,
            &String::from_str(&env, "Terra"),
            &stats1,
        );
        let c2 = client.mint_commander(
            &owner,
            &String::from_str(&env, "Nova"),
            &Rarity::Epic,
            &String::from_str(&env, "Solari"),
            &stats2,
        );

        assert_eq!(c1.id, 1);
        assert_eq!(c2.id, 2);
    }

    #[test]
    #[should_panic(expected = "stats must have exactly 5 values")]
    fn test_mint_invalid_stats_count() {
        let (env, client, _admin, owner) = setup();

        let stats = vec![&env, 80u32, 70u32, 60u32];
        client.mint_commander(
            &owner,
            &String::from_str(&env, "Atlas"),
            &Rarity::Rare,
            &String::from_str(&env, "Terra"),
            &stats,
        );
    }

    #[test]
    #[should_panic(expected = "stat value exceeds maximum")]
    fn test_mint_stat_exceeds_max() {
        let (env, client, _admin, owner) = setup();

        let stats = vec![&env, 80u32, 70u32, 60u32, 50u32, 101u32];
        client.mint_commander(
            &owner,
            &String::from_str(&env, "Atlas"),
            &Rarity::Rare,
            &String::from_str(&env, "Terra"),
            &stats,
        );
    }

    #[test]
    fn test_transfer() {
        let (env, client, _admin, owner) = setup();
        let new_owner = Address::generate(&env);

        let stats = vec![&env, 80u32, 70u32, 60u32, 50u32, 90u32];
        client.mint_commander(
            &owner,
            &String::from_str(&env, "Atlas"),
            &Rarity::Rare,
            &String::from_str(&env, "Terra"),
            &stats,
        );

        client.transfer(&1, &new_owner);

        let commander = client
            .get_commander(&1)
            .expect("commander should exist");
        assert_eq!(commander.owner, new_owner);

        let old_owned = client.get_owned_commanders(&owner);
        assert_eq!(old_owned.len(), 0);

        let new_owned = client.get_owned_commanders(&new_owner);
        assert_eq!(new_owned.len(), 1);
        assert_eq!(new_owned.get(0).unwrap().id, 1);
    }

    #[test]
    fn test_mark_fallen() {
        let (env, client, _admin, owner) = setup();

        let stats = vec![&env, 80u32, 70u32, 60u32, 50u32, 90u32];
        client.mint_commander(
            &owner,
            &String::from_str(&env, "Atlas"),
            &Rarity::Rare,
            &String::from_str(&env, "Terra"),
            &stats,
        );

        client.mark_fallen(&1);

        let commander = client
            .get_commander(&1)
            .expect("commander should exist");
        assert!(commander.is_fallen);
        assert_eq!(commander.morale, 0);
    }

    #[test]
    #[should_panic(expected = "contract is paused")]
    fn test_mint_when_paused() {
        let (env, client, _admin, owner) = setup();
        client.pause();

        let stats = vec![&env, 80u32, 70u32, 60u32, 50u32, 90u32];
        client.mint_commander(
            &owner,
            &String::from_str(&env, "Atlas"),
            &Rarity::Rare,
            &String::from_str(&env, "Terra"),
            &stats,
        );
    }

    #[test]
    #[should_panic(expected = "contract is paused")]
    fn test_transfer_when_paused() {
        let (env, client, _admin, owner) = setup();
        let new_owner = Address::generate(&env);

        let stats = vec![&env, 80u32, 70u32, 60u32, 50u32, 90u32];
        client.mint_commander(
            &owner,
            &String::from_str(&env, "Atlas"),
            &Rarity::Rare,
            &String::from_str(&env, "Terra"),
            &stats,
        );

        client.pause();
        client.transfer(&1, &new_owner);
    }

    #[test]
    fn test_pause_unpause() {
        let (_env, client, _admin, _owner) = setup();

        assert!(!client.is_paused());
        client.pause();
        assert!(client.is_paused());
        client.unpause();
        assert!(!client.is_paused());
    }

    #[test]
    fn test_get_commander_nonexistent() {
        let (_env, client, _admin, _owner) = setup();
        let result = client.get_commander(&999);
        assert!(result.is_none());
    }

    #[test]
    fn test_get_owned_commanders_multiple_owners() {
        let (env, client, _admin, _owner) = setup();
        let owner1 = Address::generate(&env);
        let owner2 = Address::generate(&env);

        let stats1 = vec![&env, 80u32, 70u32, 60u32, 50u32, 90u32];
        let stats2 = vec![&env, 50u32, 60u32, 70u32, 80u32, 90u32];

        client.mint_commander(
            &owner1,
            &String::from_str(&env, "Atlas"),
            &Rarity::Rare,
            &String::from_str(&env, "Terra"),
            &stats1,
        );
        client.mint_commander(
            &owner2,
            &String::from_str(&env, "Nova"),
            &Rarity::Epic,
            &String::from_str(&env, "Solari"),
            &stats2,
        );

        let owned1 = client.get_owned_commanders(&owner1);
        assert_eq!(owned1.len(), 1);
        assert_eq!(owned1.get(0).unwrap().id, 1);

        let owned2 = client.get_owned_commanders(&owner2);
        assert_eq!(owned2.len(), 1);
        assert_eq!(owned2.get(0).unwrap().id, 2);
    }

    #[test]
    fn test_rarity_enum_values() {
        let (env, client, _admin, owner) = setup();

        let stats = vec![&env, 10u32, 20u32, 30u32, 40u32, 50u32];
        let c = client.mint_commander(
            &owner,
            &String::from_str(&env, "Test"),
            &Rarity::Legendary,
            &String::from_str(&env, "Void"),
            &stats,
        );
        assert_eq!(c.rarity, Rarity::Legendary);
    }
}
