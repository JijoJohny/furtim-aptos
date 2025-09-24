module furtim::stealth_address {
    use std::signer;
    use std::string::String;
    use std::vector;

    // Errors
    const E_REGISTRY_ALREADY_EXISTS: u64 = 1;
    const E_REGISTRY_NOT_FOUND: u64 = 2;
    const E_INVALID_PUBLIC_KEYS: u64 = 3;

    // Struct to store a user's public meta keys
    struct StealthAddressRegistry has key {
        owner: address,
        scan_public_key: vector<u8>, // X25519 public key
        spend_public_key: vector<u8>, // Ed25519 public key
    }

    // Initializes the StealthAddressRegistry for the sender
    public entry fun initialize(
        sender: &signer,
    ) {
        let sender_addr = signer::address_of(sender);
        assert!(!exists<StealthAddressRegistry>(sender_addr), E_REGISTRY_ALREADY_EXISTS);

        move_to(sender, StealthAddressRegistry {
            owner: sender_addr,
            scan_public_key: vector::empty(),
            spend_public_key: vector::empty(),
        });
    }

    // Function to register stealth address with public keys
    public entry fun register_stealth_address(
        sender: &signer,
        scan_public_key: vector<u8>,
        spend_public_key: vector<u8>,
    ) acquires StealthAddressRegistry {
        let sender_addr = signer::address_of(sender);
        assert!(exists<StealthAddressRegistry>(sender_addr), E_REGISTRY_NOT_FOUND);
        assert!(vector::length(&scan_public_key) == 32 && vector::length(&spend_public_key) == 32, E_INVALID_PUBLIC_KEYS);

        let registry = borrow_global_mut<StealthAddressRegistry>(sender_addr);
        registry.scan_public_key = scan_public_key;
        registry.spend_public_key = spend_public_key;
    }

    // Function to get a recipient's public meta keys
    public fun get_recipient_public_keys(
        recipient_address: address
    ): (vector<u8>, vector<u8>) acquires StealthAddressRegistry {
        assert!(exists<StealthAddressRegistry>(recipient_address), E_REGISTRY_NOT_FOUND);
        let registry = borrow_global<StealthAddressRegistry>(recipient_address);
        (registry.scan_public_key, registry.spend_public_key)
    }

    // Function to create a stealth payment
    public entry fun create_stealth_payment(
        sender: &signer,
        recipient_stealth_address: address,
        ephemeral_public_key: vector<u8>,
        amount: u64,
        coin_type: String,
        tx_hash: vector<u8>,
    ) {
        assert!(exists<StealthAddressRegistry>(recipient_stealth_address), E_REGISTRY_NOT_FOUND);
        assert!(vector::length(&ephemeral_public_key) == 32, E_INVALID_PUBLIC_KEYS);

        // For now, just validate the payment parameters
        let _ = sender;
        let _ = amount;
        let _ = coin_type;
        let _ = tx_hash;
    }

    // Function to claim a stealth payment
    public entry fun claim_stealth_payment(
        claimer: &signer,
        recipient_main_address: address,
        payment_id: u64,
        ephemeral_public_key: vector<u8>,
        shared_secret_proof: vector<u8>,
    ) {
        // This function can be extended to handle actual coin transfers
        // For now, it just validates the claim
        let _ = claimer;
        let _ = recipient_main_address;
        let _ = payment_id;
        let _ = ephemeral_public_key;
        let _ = shared_secret_proof;
    }

    // Function to get stealth address info
    public fun get_stealth_address_info(
        address: address
    ): (vector<u8>, vector<u8>, bool) acquires StealthAddressRegistry {
        if (exists<StealthAddressRegistry>(address)) {
            let registry = borrow_global<StealthAddressRegistry>(address);
            (registry.scan_public_key, registry.spend_public_key, true)
        } else {
            (vector::empty(), vector::empty(), false)
        }
    }

    // Function to deactivate stealth address
    public entry fun deactivate_stealth_address(
        sender: &signer,
    ) acquires StealthAddressRegistry {
        let sender_addr = signer::address_of(sender);
        assert!(exists<StealthAddressRegistry>(sender_addr), E_REGISTRY_NOT_FOUND);
        
        let registry = borrow_global_mut<StealthAddressRegistry>(sender_addr);
        registry.scan_public_key = vector::empty();
        registry.spend_public_key = vector::empty();
    }

    // Function to reactivate stealth address
    public entry fun reactivate_stealth_address(
        sender: &signer,
        scan_public_key: vector<u8>,
        spend_public_key: vector<u8>,
    ) acquires StealthAddressRegistry {
        let sender_addr = signer::address_of(sender);
        assert!(exists<StealthAddressRegistry>(sender_addr), E_REGISTRY_NOT_FOUND);
        assert!(vector::length(&scan_public_key) == 32 && vector::length(&spend_public_key) == 32, E_INVALID_PUBLIC_KEYS);

        let registry = borrow_global_mut<StealthAddressRegistry>(sender_addr);
        registry.scan_public_key = scan_public_key;
        registry.spend_public_key = spend_public_key;
    }
}