use mint_controller::MintControllerClient;
use soroban_sdk::token::TokenClient;
use soroban_sdk::{contract, contractimpl, contracttype, log, vec, Address, Env, Vec};

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Listing {
    pub id: u32,
    pub seller: Address,
    pub commander_id: u32,
    pub price: i128,
    pub is_active: bool,
    pub created_at: u64,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Paused,
    NextListingId,
    Listing(u32),
    CommanderListing(u32),
    SellerListings(Address),
    Treasury,
    FeePercent,
    Token,
    MintController,
}

const MAX_FEE_PERCENT: u32 = 1000;
const INITIAL_FEE_PERCENT: u32 = 250;
const FEE_DENOMINATOR: u32 = 10000;

#[contract]
pub struct Marketplace;

#[contractimpl]
impl Marketplace {
    pub fn initialize(
        env: Env,
        admin: Address,
        treasury: Address,
        token: Address,
        mint_controller: Address,
    ) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Paused, &false);
        env.storage().instance().set(&DataKey::NextListingId, &1u32);
        env.storage().instance().set(&DataKey::Treasury, &treasury);
        env.storage().instance().set(&DataKey::FeePercent, &INITIAL_FEE_PERCENT);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::MintController, &mint_controller);
        log!(&env, "Marketplace initialized");
    }

    pub fn list_commander(env: Env, seller: Address, commander_id: u32, price: i128) -> Listing {
        if Self::is_paused_internal(&env) {
            panic!("contract is paused");
        }
        seller.require_auth();

        if price <= 0 {
            panic!("price must be positive");
        }

        if env
            .storage()
            .instance()
            .has(&DataKey::CommanderListing(commander_id))
        {
            panic!("commander already listed");
        }

        let mc_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::MintController)
            .expect("not initialized");
        let mc_client = MintControllerClient::new(&env, &mc_addr);
        let commander = mc_client
            .get_commander(&commander_id)
            .expect("commander not found");
        if commander.owner != seller {
            panic!("seller does not own commander");
        }

        let id = Self::next_listing_id(&env);
        let created_at = env.ledger().timestamp();

        let listing = Listing {
            id,
            seller: seller.clone(),
            commander_id,
            price,
            is_active: true,
            created_at,
        };

        env.storage()
            .instance()
            .set(&DataKey::Listing(id), &listing);
        env.storage()
            .instance()
            .set(&DataKey::CommanderListing(commander_id), &id);
        Self::add_to_seller_listings(&env, &seller, id);

        log!(&env, "Listed commander {} for {} price {}", commander_id, seller, price);
        listing
    }

    pub fn buy_commander(env: Env, buyer: Address, listing_id: u32) {
        if Self::is_paused_internal(&env) {
            panic!("contract is paused");
        }
        buyer.require_auth();

        let mut listing: Listing = env
            .storage()
            .instance()
            .get(&DataKey::Listing(listing_id))
            .expect("listing not found");

        if !listing.is_active {
            panic!("listing is not active");
        }
        if listing.seller == buyer {
            panic!("seller cannot buy their own listing");
        }

        let fee_percent: u32 = env
            .storage()
            .instance()
            .get(&DataKey::FeePercent)
            .expect("not initialized");
        let treasury: Address = env
            .storage()
            .instance()
            .get(&DataKey::Treasury)
            .expect("not initialized");
        let token: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .expect("not initialized");
        let mc_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::MintController)
            .expect("not initialized");

        let fee = listing.price * (fee_percent as i128) / (FEE_DENOMINATOR as i128);
        let amount_to_seller = listing.price - fee;

        let token_client = TokenClient::new(&env, &token);
        token_client.transfer(&buyer, &listing.seller, &amount_to_seller);
        if fee > 0 {
            token_client.transfer(&buyer, &treasury, &fee);
        }

        let mc_client = MintControllerClient::new(&env, &mc_addr);
        mc_client.transfer(&listing.commander_id, &buyer);

        listing.is_active = false;
        env.storage()
            .instance()
            .set(&DataKey::Listing(listing_id), &listing);
        env.storage()
            .instance()
            .remove(&DataKey::CommanderListing(listing.commander_id));

        log!(&env, "Commander {} bought by {} for {}", listing.commander_id, buyer, listing.price);
    }

    pub fn cancel_listing(env: Env, seller: Address, listing_id: u32) {
        seller.require_auth();

        let mut listing: Listing = env
            .storage()
            .instance()
            .get(&DataKey::Listing(listing_id))
            .expect("listing not found");

        if listing.seller != seller {
            panic!("not the listing seller");
        }
        if !listing.is_active {
            panic!("listing is not active");
        }

        let commander_id = listing.commander_id;
        listing.is_active = false;
        env.storage()
            .instance()
            .set(&DataKey::Listing(listing_id), &listing);
        env.storage()
            .instance()
            .remove(&DataKey::CommanderListing(commander_id));

        log!(&env, "Listing {} cancelled by seller {}", listing_id, seller);
    }

    pub fn get_listing(env: Env, listing_id: u32) -> Option<Listing> {
        env.storage()
            .instance()
            .get(&DataKey::Listing(listing_id))
    }

    pub fn get_commander_listing(env: Env, commander_id: u32) -> Option<Listing> {
        let listing_id: u32 = env
            .storage()
            .instance()
            .get(&DataKey::CommanderListing(commander_id))?;
        env.storage()
            .instance()
            .get(&DataKey::Listing(listing_id))
    }

    pub fn get_seller_listings(env: Env, seller: Address) -> Vec<Listing> {
        let ids = Self::get_seller_listing_ids(&env, &seller);
        let mut result: Vec<Listing> = vec![&env];
        for i in 0..ids.len() {
            if let Some(listing) = env
                .storage()
                .instance()
                .get(&DataKey::Listing(ids.get(i).unwrap()))
            {
                result.push_back(listing);
            }
        }
        result
    }

    pub fn pause(env: Env) {
        let admin = Self::get_admin(&env);
        admin.require_auth();
        env.storage().instance().set(&DataKey::Paused, &true);
        log!(&env, "Marketplace paused");
    }

    pub fn unpause(env: Env) {
        let admin = Self::get_admin(&env);
        admin.require_auth();
        env.storage().instance().set(&DataKey::Paused, &false);
        log!(&env, "Marketplace unpaused");
    }

    pub fn is_paused(env: &Env) -> bool {
        Self::is_paused_internal(env)
    }

    pub fn set_fee(env: Env, new_fee: u32) {
        let admin = Self::get_admin(&env);
        admin.require_auth();
        if new_fee > MAX_FEE_PERCENT {
            panic!("fee exceeds maximum");
        }
        env.storage().instance().set(&DataKey::FeePercent, &new_fee);
        log!(&env, "Fee set to {} basis points", new_fee);
    }

    pub fn set_treasury(env: Env, new_treasury: Address) {
        let admin = Self::get_admin(&env);
        admin.require_auth();
        env.storage().instance().set(&DataKey::Treasury, &new_treasury);
        log!(&env, "Treasury updated");
    }

    pub fn set_token(env: Env, new_token: Address) {
        let admin = Self::get_admin(&env);
        admin.require_auth();
        env.storage().instance().set(&DataKey::Token, &new_token);
        log!(&env, "Token contract updated");
    }

    pub fn set_mint_controller(env: Env, new_mc: Address) {
        let admin = Self::get_admin(&env);
        admin.require_auth();
        env.storage().instance().set(&DataKey::MintController, &new_mc);
        log!(&env, "MintController updated");
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

    fn next_listing_id(env: &Env) -> u32 {
        let id: u32 = env
            .storage()
            .instance()
            .get(&DataKey::NextListingId)
            .expect("not initialized");
        env.storage()
            .instance()
            .set(&DataKey::NextListingId, &(id + 1));
        id
    }

    fn get_seller_listing_ids(env: &Env, seller: &Address) -> Vec<u32> {
        env.storage()
            .instance()
            .get(&DataKey::SellerListings(seller.clone()))
            .unwrap_or_else(|| vec![&env])
    }

    fn add_to_seller_listings(env: &Env, seller: &Address, id: u32) {
        let mut ids = Self::get_seller_listing_ids(env, seller);
        ids.push_back(id);
        env.storage()
            .instance()
            .set(&DataKey::SellerListings(seller.clone()), &ids);
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use mint_controller::{MintController, MintControllerClient, Rarity};
    use soroban_sdk::{
        self, contract, contractimpl, contracttype, vec,
        testutils::Address as _,
        Address, Env, String,
    };

    #[contracttype]
    enum TKey {
        Balance(Address),
        Admin,
    }

    #[contract]
    struct TToken;

    #[contractimpl]
    impl TToken {
        pub fn initialize(env: Env, admin: Address) {
            admin.require_auth();
            env.storage().instance().set(&TKey::Admin, &admin);
        }

        pub fn mint(env: Env, to: Address, amount: i128) {
            let admin: Address = env.storage().instance().get(&TKey::Admin).unwrap();
            admin.require_auth();
            let bal: i128 = env
                .storage()
                .instance()
                .get(&TKey::Balance(to.clone()))
                .unwrap_or(0);
            env.storage()
                .instance()
                .set(&TKey::Balance(to.clone()), &(bal + amount));
        }

        pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
            from.require_auth();
            let from_bal: i128 = env
                .storage()
                .instance()
                .get(&TKey::Balance(from.clone()))
                .unwrap_or(0);
            if from_bal < amount {
                panic!("insufficient balance");
            }
            let to_bal: i128 = env
                .storage()
                .instance()
                .get(&TKey::Balance(to.clone()))
                .unwrap_or(0);
            env.storage()
                .instance()
                .set(&TKey::Balance(from.clone()), &(from_bal - amount));
            env.storage()
                .instance()
                .set(&TKey::Balance(to.clone()), &(to_bal + amount));
        }

        pub fn balance(env: Env, addr: Address) -> i128 {
            env.storage()
                .instance()
                .get(&TKey::Balance(addr))
                .unwrap_or(0)
        }
    }

    fn setup() -> (
        Env,
        MarketplaceClient<'static>,
        Address,
        Address,
        Address,
        Address,
        Address,
        Address,
    ) {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();
        let admin = Address::generate(&env);
        let treasury = Address::generate(&env);
        let seller = Address::generate(&env);
        let buyer = Address::generate(&env);

        let token_id = env.register(TToken, ());
        let token_client = TTokenClient::new(&env, &token_id);
        token_client.initialize(&admin);

        let mc_id = env.register(MintController, ());
        let mc_client = MintControllerClient::new(&env, &mc_id);
        mc_client.initialize(&admin);

        let mp_id = env.register(Marketplace, ());
        let mp_client = MarketplaceClient::new(&env, &mp_id);
        mp_client.initialize(&admin, &treasury, &token_id, &mc_id);

        let stats = vec![&env, 80u32, 70u32, 60u32, 50u32, 90u32];
        mc_client.mint_commander(
            &seller,
            &String::from_str(&env, "Atlas"),
            &Rarity::Rare,
            &String::from_str(&env, "Terra"),
            &stats,
        );

        token_client.mint(&buyer, &1000i128);

        (
            env, mp_client, admin, treasury, seller, buyer, token_id, mc_id,
        )
    }

    #[test]
    fn test_initialize() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let treasury = Address::generate(&env);
        let token = Address::generate(&env);
        let mc = Address::generate(&env);
        let contract_id = env.register(Marketplace, ());
        let client = MarketplaceClient::new(&env, &contract_id);
        client.initialize(&admin, &treasury, &token, &mc);
        assert!(!client.is_paused());
    }

    #[test]
    #[should_panic(expected = "already initialized")]
    fn test_initialize_twice() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let treasury = Address::generate(&env);
        let token = Address::generate(&env);
        let mc = Address::generate(&env);
        let contract_id = env.register(Marketplace, ());
        let client = MarketplaceClient::new(&env, &contract_id);
        client.initialize(&admin, &treasury, &token, &mc);
        client.initialize(&admin, &treasury, &token, &mc);
    }

    #[test]
    fn test_list_commander() {
        let (_env, mp_client, _admin, _treasury, seller, _buyer, _token_id, _mc_id) = setup();

        let listing = mp_client.list_commander(&seller, &1u32, &100i128);

        assert_eq!(listing.id, 1);
        assert_eq!(listing.seller, seller);
        assert_eq!(listing.commander_id, 1);
        assert_eq!(listing.price, 100);
        assert!(listing.is_active);
    }

    #[test]
    #[should_panic(expected = "commander already listed")]
    fn test_list_commander_twice() {
        let (_env, mp_client, _admin, _treasury, seller, _buyer, _token_id, _mc_id) = setup();

        mp_client.list_commander(&seller, &1u32, &100i128);
        mp_client.list_commander(&seller, &1u32, &200i128);
    }

    #[test]
    #[should_panic(expected = "price must be positive")]
    fn test_list_commander_zero_price() {
        let (_env, mp_client, _admin, _treasury, seller, _buyer, _token_id, _mc_id) = setup();

        mp_client.list_commander(&seller, &1u32, &0i128);
    }

    #[test]
    fn test_buy_commander() {
        let (env, mp_client, _admin, treasury, seller, buyer, token_id, mc_id) = setup();

        let token_client = TTokenClient::new(&env, &token_id);
        let mc_client = MintControllerClient::new(&env, &mc_id);

        mp_client.list_commander(&seller, &1u32, &100i128);

        let seller_bal_before = token_client.balance(&seller);
        let treasury_bal_before = token_client.balance(&treasury);
        let buyer_bal_before = token_client.balance(&buyer);

        mp_client.buy_commander(&buyer, &1u32);

        let fee = 100i128 * 250 / 10000;
        let expected_to_seller = 100 - fee;

        assert_eq!(
            token_client.balance(&seller),
            seller_bal_before + expected_to_seller
        );
        assert_eq!(
            token_client.balance(&treasury),
            treasury_bal_before + fee
        );
        assert_eq!(
            token_client.balance(&buyer),
            buyer_bal_before - 100
        );

        let commander = mc_client
            .get_commander(&1)
            .expect("commander should exist");
        assert_eq!(commander.owner, buyer);

        let listing = mp_client
            .get_listing(&1)
            .expect("listing should exist");
        assert!(!listing.is_active);
    }

    #[test]
    #[should_panic(expected = "seller cannot buy their own listing")]
    fn test_self_purchase_prevented() {
        let (_env, mp_client, _admin, _treasury, seller, _buyer, _token_id, _mc_id) = setup();

        mp_client.list_commander(&seller, &1u32, &100i128);
        mp_client.buy_commander(&seller, &1u32);
    }

    #[test]
    fn test_cancel_listing() {
        let (_env, mp_client, _admin, _treasury, seller, _buyer, _token_id, _mc_id) = setup();

        mp_client.list_commander(&seller, &1u32, &100i128);

        let listing_before = mp_client
            .get_listing(&1)
            .expect("listing should exist");
        assert!(listing_before.is_active);

        mp_client.cancel_listing(&seller, &1u32);

        let listing_after = mp_client
            .get_listing(&1)
            .expect("listing should exist");
        assert!(!listing_after.is_active);
    }

    #[test]
    #[should_panic(expected = "listing is not active")]
    fn test_buy_cancelled_listing() {
        let (_env, mp_client, _admin, _treasury, seller, buyer, _token_id, _mc_id) = setup();

        mp_client.list_commander(&seller, &1u32, &100i128);
        mp_client.cancel_listing(&seller, &1u32);
        mp_client.buy_commander(&buyer, &1u32);
    }

    #[test]
    fn test_fee_math() {
        let (env, mp_client, _admin, treasury, seller, buyer, token_id, _mc_id) = setup();

        let token_client = TTokenClient::new(&env, &token_id);
        token_client.mint(&buyer, &10000i128);

        let price: i128 = 1000;
        mp_client.list_commander(&seller, &1u32, &price);

        let seller_before = token_client.balance(&seller);
        let treasury_before = token_client.balance(&treasury);

        mp_client.buy_commander(&buyer, &1u32);

        let expected_fee = price * 250 / 10000;
        let expected_to_seller = price - expected_fee;

        assert_eq!(
            token_client.balance(&seller),
            seller_before + expected_to_seller
        );
        assert_eq!(
            token_client.balance(&treasury),
            treasury_before + expected_fee
        );
        assert_eq!(expected_fee, 25i128);
        assert_eq!(expected_to_seller, 975i128);
    }

    #[test]
    fn test_get_commander_listing() {
        let (_env, mp_client, _admin, _treasury, seller, _buyer, _token_id, _mc_id) = setup();

        let listing = mp_client.get_commander_listing(&1);
        assert!(listing.is_none());

        mp_client.list_commander(&seller, &1u32, &100i128);

        let listing = mp_client
            .get_commander_listing(&1)
            .expect("listing should exist");
        assert_eq!(listing.commander_id, 1);
        assert_eq!(listing.price, 100);
    }

    #[test]
    fn test_get_seller_listings() {
        let (env, mp_client, _admin, _treasury, seller, buyer, token_id, mc_id) = setup();

        let mc_client = MintControllerClient::new(&env, &mc_id);
        let token_client = TTokenClient::new(&env, &token_id);

        let stats2 = vec![&env, 50u32, 60u32, 70u32, 80u32, 90u32];
        mc_client.mint_commander(
            &seller,
            &String::from_str(&env, "Nova"),
            &Rarity::Epic,
            &String::from_str(&env, "Solari"),
            &stats2,
        );
        token_client.mint(&buyer, &10000i128);

        let listings_before = mp_client.get_seller_listings(&seller);
        assert_eq!(listings_before.len(), 0);

        mp_client.list_commander(&seller, &1u32, &100i128);
        mp_client.list_commander(&seller, &2u32, &200i128);

        let listings = mp_client.get_seller_listings(&seller);
        assert_eq!(listings.len(), 2);
        assert_eq!(listings.get(0).unwrap().price, 100);
        assert_eq!(listings.get(1).unwrap().price, 200);
    }

    #[test]
    fn test_pause_unpause() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let treasury = Address::generate(&env);
        let token = Address::generate(&env);
        let mc = Address::generate(&env);
        let contract_id = env.register(Marketplace, ());
        let client = MarketplaceClient::new(&env, &contract_id);
        client.initialize(&admin, &treasury, &token, &mc);

        assert!(!client.is_paused());
        client.pause();
        assert!(client.is_paused());
        client.unpause();
        assert!(!client.is_paused());
    }

    #[test]
    #[should_panic(expected = "contract is paused")]
    fn test_list_when_paused() {
        let (_env, mp_client, _admin, _treasury, seller, _buyer, _token_id, _mc_id) = setup();

        mp_client.pause();
        mp_client.list_commander(&seller, &1u32, &100i128);
    }

    #[test]
    #[should_panic(expected = "contract is paused")]
    fn test_buy_when_paused() {
        let (_env, mp_client, _admin, _treasury, seller, buyer, _token_id, _mc_id) = setup();

        mp_client.list_commander(&seller, &1u32, &100i128);
        mp_client.pause();
        mp_client.buy_commander(&buyer, &1u32);
    }

    #[test]
    fn test_get_listing_nonexistent() {
        let (_env, mp_client, _admin, _treasury, _seller, _buyer, _token_id, _mc_id) = setup();

        let result = mp_client.get_listing(&999);
        assert!(result.is_none());
    }

    #[test]
    fn test_set_fee() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let treasury = Address::generate(&env);
        let token = Address::generate(&env);
        let mc = Address::generate(&env);
        let contract_id = env.register(Marketplace, ());
        let client = MarketplaceClient::new(&env, &contract_id);
        client.initialize(&admin, &treasury, &token, &mc);

        client.set_fee(&500u32);
        assert!(!client.is_paused());
    }

    #[test]
    #[should_panic(expected = "fee exceeds maximum")]
    fn test_set_fee_exceeds_max() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let treasury = Address::generate(&env);
        let token = Address::generate(&env);
        let mc = Address::generate(&env);
        let contract_id = env.register(Marketplace, ());
        let client = MarketplaceClient::new(&env, &contract_id);
        client.initialize(&admin, &treasury, &token, &mc);

        client.set_fee(&1001u32);
    }

    #[test]
    fn test_set_treasury() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let treasury = Address::generate(&env);
        let new_treasury = Address::generate(&env);
        let token = Address::generate(&env);
        let mc = Address::generate(&env);
        let contract_id = env.register(Marketplace, ());
        let client = MarketplaceClient::new(&env, &contract_id);
        client.initialize(&admin, &treasury, &token, &mc);

        client.set_treasury(&new_treasury);
    }

    #[test]
    fn test_cancel_then_relist_commander() {
        let (env, mp_client, _admin, _treasury, seller, _buyer, token_id, mc_id) = setup();

        let mc_client = MintControllerClient::new(&env, &mc_id);
        let token_client = TTokenClient::new(&env, &token_id);

        let stats2 = vec![&env, 50u32, 60u32, 70u32, 80u32, 90u32];
        mc_client.mint_commander(
            &seller,
            &String::from_str(&env, "Nova"),
            &Rarity::Epic,
            &String::from_str(&env, "Solari"),
            &stats2,
        );
        token_client.mint(&seller, &10000i128);

        mp_client.list_commander(&seller, &2u32, &200i128);
        mp_client.cancel_listing(&seller, &1u32);

        let listing = mp_client.list_commander(&seller, &2u32, &250i128);
        assert_eq!(listing.price, 250);
        assert!(listing.is_active);
    }

    #[test]
    fn test_buy_then_relist_commander() {
        let (env, mp_client, _admin, _treasury, seller, buyer, token_id, mc_id) = setup();

        let mc_client = MintControllerClient::new(&env, &mc_id);
        let token_client = TTokenClient::new(&env, &token_id);

        token_client.mint(&buyer, &10000i128);

        mp_client.list_commander(&seller, &1u32, &100i128);
        mp_client.buy_commander(&buyer, &1u32);

        let commander = mc_client.get_commander(&1).unwrap();
        assert_eq!(commander.owner, buyer);

        mp_client.list_commander(&buyer, &1u32, &150i128);
        let listing = mp_client.get_commander_listing(&1).unwrap();
        assert_eq!(listing.price, 150);
        assert!(listing.is_active);
    }

    #[test]
    #[should_panic(expected = "insufficient balance")]
    fn test_buy_insufficient_funds() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();
        let admin = Address::generate(&env);
        let treasury = Address::generate(&env);
        let seller = Address::generate(&env);
        let buyer = Address::generate(&env);

        let token_id = env.register(TToken, ());
        let token_client = TTokenClient::new(&env, &token_id);
        token_client.initialize(&admin);

        let mc_id = env.register(MintController, ());
        let mc_client = MintControllerClient::new(&env, &mc_id);
        mc_client.initialize(&admin);

        let mp_id = env.register(Marketplace, ());
        let mp_client = MarketplaceClient::new(&env, &mp_id);
        mp_client.initialize(&admin, &treasury, &token_id, &mc_id);

        let stats = vec![&env, 80u32, 70u32, 60u32, 50u32, 90u32];
        mc_client.mint_commander(
            &seller,
            &String::from_str(&env, "Atlas"),
            &Rarity::Rare,
            &String::from_str(&env, "Terra"),
            &stats,
        );

        token_client.mint(&buyer, &50i128);

        mp_client.list_commander(&seller, &1u32, &100i128);
        mp_client.buy_commander(&buyer, &1u32);
    }

    #[test]
    fn test_buy_commander_transfers_ownership() {
        let (env, mp_client, _admin, _treasury, seller, buyer, token_id, mc_id) = setup();

        let mc_client = MintControllerClient::new(&env, &mc_id);
        let token_client = TTokenClient::new(&env, &token_id);
        token_client.mint(&buyer, &10000i128);

        mp_client.list_commander(&seller, &1u32, &100i128);
        mp_client.buy_commander(&buyer, &1u32);

        let commander = mc_client
            .get_commander(&1)
            .expect("commander should exist");
        assert_eq!(commander.owner, buyer);

        let owned = mc_client.get_owned_commanders(&buyer);
        assert_eq!(owned.len(), 1);
        assert_eq!(owned.get(0).unwrap().id, 1);

        let owned_seller = mc_client.get_owned_commanders(&seller);
        assert_eq!(owned_seller.len(), 0);
    }
}
