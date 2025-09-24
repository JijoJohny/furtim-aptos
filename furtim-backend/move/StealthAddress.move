module furtim::stealth_address {
    use std::signature::Ed25519PublicKey;
    use std::vector;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::account;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::table::{Self, Table};
    use aptos_framework::timestamp;
    use aptos_framework::signer;
    use aptos_framework::resource_account;
    use std::string::{Self, String};
    use std::option::{Self, Option};

    // Error codes
    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;
    const E_INVALID_STEALTH_ADDRESS: u64 = 3;
    const E_INSUFFICIENT_BALANCE: u64 = 4;
    const E_ALREADY_CLAIMED: u64 = 5;
    const E_NOT_CLAIMABLE: u64 = 6;
    const E_UNAUTHORIZED: u64 = 7;
    const E_INVALID_AMOUNT: u64 = 8;

    // Structs for stealth address functionality
    struct StealthPayment has key {
        // Unique identifier for this stealth payment
        id: u64,
        // The stealth address where funds were sent
        stealth_address: address,
        // The ephemeral public key used to create the stealth address
        ephemeral_public_key: vector<u8>,
        // The amount sent to the stealth address
        amount: u64,
        // The coin type (e.g., AptosCoin)
        coin_type: String,
        // Timestamp when payment was made
        timestamp: u64,
        // Whether this payment has been claimed
        claimed: bool,
        // The address that claimed this payment (if claimed)
        claimed_by: Option<address>,
        // Transaction hash of the original payment
        tx_hash: vector<u8>,
    }

    struct StealthAddressRegistry has key {
        // Registry of all stealth addresses and their associated meta keys
        registry: Table<address, StealthAddressInfo>,
        // Counter for unique payment IDs
        payment_counter: u64,
        // Events
        payment_created_events: EventHandle<PaymentCreatedEvent>,
        payment_claimed_events: EventHandle<PaymentClaimedEvent>,
    }

    struct StealthAddressInfo has store {
        // The user's scan public key (for detecting payments)
        scan_public_key: vector<u8>,
        // The user's spend public key (for claiming payments)
        spend_public_key: vector<u8>,
        // Whether this stealth address is active
        is_active: bool,
        // Total payments received
        total_payments: u64,
        // Total amount received
        total_amount: u64,
    }

    // Events
    struct PaymentCreatedEvent has store, drop {
        payment_id: u64,
        stealth_address: address,
        amount: u64,
        coin_type: String,
        timestamp: u64,
    }

    struct PaymentClaimedEvent has store, drop {
        payment_id: u64,
        stealth_address: address,
        claimed_by: address,
        amount: u64,
        timestamp: u64,
    }

    // Initialize the stealth address system
    public entry fun initialize(account: &signer) {
        let account_addr = signer::address_of(account);
        
        // Check if already initialized
        assert!(!exists<StealthAddressRegistry>(account_addr), E_ALREADY_INITIALIZED);
        
        // Create the registry
        move_to(account, StealthAddressRegistry {
            registry: table::new(),
            payment_counter: 0,
            payment_created_events: account::new_event_handle<PaymentCreatedEvent>(account),
            payment_claimed_events: account::new_event_handle<PaymentClaimedEvent>(account),
        });
    }

    // Register a user's stealth address with their meta keys
    public entry fun register_stealth_address(
        account: &signer,
        scan_public_key: vector<u8>,
        spend_public_key: vector<u8>,
    ) acquires StealthAddressRegistry {
        let account_addr = signer::address_of(account);
        let registry = borrow_global_mut<StealthAddressRegistry>(@furtim);
        
        // Check if already registered
        assert!(!table::contains(&registry.registry, account_addr), E_ALREADY_INITIALIZED);
        
        // Register the stealth address info
        table::add(&mut registry.registry, account_addr, StealthAddressInfo {
            scan_public_key,
            spend_public_key,
            is_active: true,
            total_payments: 0,
            total_amount: 0,
        });
    }

    // Create a stealth payment (called by sender)
    public entry fun create_stealth_payment(
        account: &signer,
        stealth_address: address,
        ephemeral_public_key: vector<u8>,
        amount: u64,
        coin_type: String,
        tx_hash: vector<u8>,
    ) acquires StealthAddressRegistry {
        let account_addr = signer::address_of(account);
        let registry = borrow_global_mut<StealthAddressRegistry>(@furtim);
        
        // Validate amount
        assert!(amount > 0, E_INVALID_AMOUNT);
        
        // Check if stealth address is registered
        assert!(table::contains(&registry.registry, stealth_address), E_INVALID_STEALTH_ADDRESS);
        
        // Create payment record
        let payment_id = registry.payment_counter + 1;
        let timestamp = timestamp::now_seconds();
        
        // Emit payment created event
        event::emit_event(&mut registry.payment_created_events, PaymentCreatedEvent {
            payment_id,
            stealth_address,
            amount,
            coin_type,
            timestamp,
        });
        
        // Update payment counter
        registry.payment_counter = payment_id;
    }

    // Claim a stealth payment (called by recipient)
    public entry fun claim_stealth_payment(
        account: &signer,
        payment_id: u64,
        stealth_address: address,
        ephemeral_public_key: vector<u8>,
        shared_secret_proof: vector<u8>, // Cryptographic proof of shared secret
    ) acquires StealthAddressRegistry {
        let account_addr = signer::address_of(account);
        let registry = borrow_global_mut<StealthAddressRegistry>(@furtim);
        
        // Verify the stealth address is registered and active
        assert!(table::contains(&registry.registry, stealth_address), E_INVALID_STEALTH_ADDRESS);
        let stealth_info = table::borrow(&registry.registry, stealth_address);
        assert!(stealth_info.is_active, E_NOT_CLAIMABLE);
        
        // TODO: Verify the shared secret proof cryptographically
        // This would involve verifying that the account can derive the correct
        // shared secret using their scan private key and the ephemeral public key
        
        // Update stealth address stats
        let stealth_info_mut = table::borrow_mut(&mut registry.registry, stealth_address);
        stealth_info_mut.total_payments = stealth_info_mut.total_payments + 1;
        // Note: amount would be retrieved from the actual payment record
        
        // Emit payment claimed event
        event::emit_event(&mut registry.payment_claimed_events, PaymentClaimedEvent {
            payment_id,
            stealth_address,
            claimed_by: account_addr,
            amount: 0, // Would be retrieved from payment record
            timestamp: timestamp::now_seconds(),
        });
    }

    // Get stealth address info
    public fun get_stealth_address_info(stealth_address: address): (vector<u8>, vector<u8>, bool, u64, u64) acquires StealthAddressRegistry {
        let registry = borrow_global<StealthAddressRegistry>(@furtim);
        assert!(table::contains(&registry.registry, stealth_address), E_INVALID_STEALTH_ADDRESS);
        
        let info = table::borrow(&registry.registry, stealth_address);
        (info.scan_public_key, info.spend_public_key, info.is_active, info.total_payments, info.total_amount)
    }

    // Deactivate a stealth address
    public entry fun deactivate_stealth_address(account: &signer) acquires StealthAddressRegistry {
        let account_addr = signer::address_of(account);
        let registry = borrow_global_mut<StealthAddressRegistry>(@furtim);
        
        assert!(table::contains(&registry.registry, account_addr), E_INVALID_STEALTH_ADDRESS);
        
        let stealth_info = table::borrow_mut(&mut registry.registry, account_addr);
        stealth_info.is_active = false;
    }

    // Reactivate a stealth address
    public entry fun reactivate_stealth_address(account: &signer) acquires StealthAddressRegistry {
        let account_addr = signer::address_of(account);
        let registry = borrow_global_mut<StealthAddressRegistry>(@furtim);
        
        assert!(table::contains(&registry.registry, account_addr), E_INVALID_STEALTH_ADDRESS);
        
        let stealth_info = table::borrow_mut(&mut registry.registry, account_addr);
        stealth_info.is_active = true;
    }

    // Helper function to check if stealth address is registered
    public fun is_stealth_address_registered(stealth_address: address): bool acquires StealthAddressRegistry {
        let registry = borrow_global<StealthAddressRegistry>(@furtim);
        table::contains(&registry.registry, stealth_address)
    }

    // Helper function to get total payments for a stealth address
    public fun get_total_payments(stealth_address: address): u64 acquires StealthAddressRegistry {
        let registry = borrow_global<StealthAddressRegistry>(@furtim);
        if (table::contains(&registry.registry, stealth_address)) {
            let info = table::borrow(&registry.registry, stealth_address);
            info.total_payments
        } else {
            0
        }
    }
}
