# Stealth Addresses Implementation

## Overview

This document describes the implementation of stealth addresses in the Furtim application, enabling private payments on the Aptos blockchain using meta keys and ECDH cryptography.

## What are Stealth Addresses?

Stealth addresses provide privacy by allowing senders to create one-time addresses for recipients without revealing the recipient's actual wallet address. Each payment uses a unique address that only the recipient can derive the private key for.

## Architecture

### Meta Keys

Meta keys are the core cryptographic material that enables stealth address functionality:

1. **Scan Keypair (scan_priv, scan_pub)**:
   - Purpose: Detects incoming stealth payments
   - Used in ECDH with sender's ephemeral public key
   - Generated as X25519 keypair for ECDH operations

2. **Spend Keypair (spend_priv, spend_pub)**:
   - Purpose: Constructs stealth private keys for spending
   - Used with shared secret to derive final private key
   - Generated as Ed25519 keypair for Aptos compatibility

### Key Generation Strategy

- **Ed25519**: Used for signing operations (Aptos native accounts)
- **X25519**: Used for ECDH shared secret derivation
- **Deterministic Generation**: Meta keys are derived from PIN + wallet signature using PBKDF2

## Implementation Details

### Frontend Services

#### `stealthAddressService.ts`

Core service handling all stealth address operations:

```typescript
// Generate meta keys from PIN and signature
const metaKeys = await stealthAddressService.generateMetaKeys(pin, signature);

// Create ephemeral keypair for sender
const ephemeralKeyPair = await stealthAddressService.createEphemeralKeyPair();

// Derive stealth address
const stealthAddress = await stealthAddressService.deriveStealthAddress(
  recipientMetaKeys,
  ephemeralPrivateKey
);

// Compute stealth private key for recipient
const stealthPrivateKey = await stealthAddressService.computeStealthPrivateKey(
  metaKeys,
  ephemeralPublicKey
);
```

### Backend Services

#### `metaKeysService.ts`

Handles secure storage and retrieval of meta keys:

- **Encryption**: Private keys encrypted with AES-256-GCM using PIN-derived key
- **Storage**: Only public keys and encrypted private keys stored in database
- **Security**: Private keys never stored in plain text

#### Database Schema

```sql
CREATE TABLE user_meta_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  scan_public_key TEXT NOT NULL,           -- X25519 public key
  spend_public_key TEXT NOT NULL,          -- Ed25519 public key  
  meta_keys_encrypted TEXT NOT NULL,       -- Encrypted private keys
  encryption_salt VARCHAR(255) NOT NULL,   -- Salt for encryption
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);
```

## User Flow

### 1. PIN Setup & Meta Key Generation

When a user sets up their PIN during registration:

1. **PIN Entry**: User enters 4-digit PIN
2. **Meta Key Generation**: 
   - Generate deterministic seed from PIN + wallet signature
   - Create scan keypair (X25519) for ECDH
   - Create spend keypair (Ed25519) for signing
3. **Encryption**: Private keys encrypted with PIN-derived key
4. **Storage**: Public keys and encrypted private keys stored in database
5. **Validation**: Meta keys validated for correctness

### 2. Stealth Address Creation (Sender)

When creating a payment link:

1. **Ephemeral Keypair**: Generate one-time X25519 keypair
2. **Shared Secret**: Compute ECDH(ephemeral_priv, scan_pub)
3. **Scalar Derivation**: Hash shared secret to scalar
4. **Stealth Address**: Compute one-time public key = scalar * G + spend_pub
5. **Address Encoding**: Derive Aptos address from one-time public key

### 3. Payment Detection & Spending (Recipient)

When recipient wants to spend stealth payments:

1. **Scan**: Check blockchain for stealth addresses using scan key
2. **Shared Secret**: Compute ECDH(scan_priv, ephemeral_pub)
3. **Scalar Derivation**: Hash shared secret to same scalar
4. **Private Key**: Compute stealth private key = scalar + spend_priv
5. **Spending**: Use stealth private key to sign transactions

## Security Considerations

### Key Management

- **PIN Protection**: Meta keys encrypted with PIN-derived key
- **Never Store Privates**: Private keys never stored in plain text
- **Deterministic**: Meta keys can be regenerated from PIN + signature
- **Hardware Security**: Keys generated and used in secure environment

### Cryptographic Security

- **Strong Randomness**: Use crypto.subtle for secure random generation
- **Key Derivation**: PBKDF2 with 100,000 iterations for key derivation
- **Encryption**: AES-256-GCM for authenticated encryption
- **Hash Functions**: SHA-256 for hash-to-scalar operations

### Privacy Guarantees

- **Unlinkability**: Stealth addresses cannot be linked to recipient's identity
- **Forward Secrecy**: Each payment uses unique ephemeral keypair
- **Backward Secrecy**: Past payments remain private even if keys compromised

## API Endpoints

### Meta Keys Management

```typescript
// Store meta keys (during registration)
POST /api/auth/register
{
  username: string,
  pin: string,
  wallet_address: string,
  signature: string,
  public_key?: string
}

// Retrieve public meta keys (for creating stealth addresses)
GET /api/stealth/public-meta-keys/:userId

// Verify PIN and retrieve meta keys (for spending)
POST /api/stealth/verify-pin
{
  pin: string,
  user_id: string
}
```

## Integration with PIN Setup

The PIN setup process now includes stealth address meta key generation:

1. **User enters PIN**: 4-digit numeric PIN
2. **Meta key generation**: Automatic generation of scan and spend keypairs
3. **Visual feedback**: Success indicator shows meta keys generated
4. **Secure storage**: Keys encrypted and stored in database
5. **Registration**: User account created with stealth capabilities

## Testing

### Unit Tests

```typescript
// Test meta key generation
const metaKeys = await stealthAddressService.generateMetaKeys('1234', 'signature');
expect(metaKeys.scanPublicKey).toBeDefined();
expect(metaKeys.spendPublicKey).toBeDefined();

// Test stealth address derivation
const stealthAddress = await stealthAddressService.deriveStealthAddress(
  metaKeys,
  ephemeralPrivateKey
);
expect(stealthAddress.address).toMatch(/^0x[a-fA-F0-9]{64}$/);

// Test private key computation
const stealthPrivateKey = await stealthAddressService.computeStealthPrivateKey(
  metaKeys,
  ephemeralPublicKey
);
expect(stealthPrivateKey).toBeDefined();
```

### Integration Tests

1. **End-to-end registration**: PIN setup → meta key generation → storage
2. **Stealth address creation**: Meta keys → ephemeral keypair → stealth address
3. **Private key derivation**: Meta keys + ephemeral public key → stealth private key
4. **Security validation**: Encrypted storage → PIN verification → decryption

## Future Enhancements

### Advanced Features

1. **Batch Scanning**: Efficiently scan multiple stealth addresses
2. **Key Rotation**: Support for updating meta keys
3. **Hardware Integration**: Support for hardware wallets
4. **Multi-signature**: Support for multi-sig stealth addresses

### Performance Optimizations

1. **Caching**: Cache frequently used public keys
2. **Parallel Processing**: Batch operations for multiple addresses
3. **Indexing**: Optimize database queries for stealth address lookups

### Privacy Enhancements

1. **Ring Signatures**: Additional privacy layer
2. **Zero-Knowledge Proofs**: Prove ownership without revealing keys
3. **Mixing Services**: Additional privacy through mixing

## Conclusion

The stealth address implementation provides a robust foundation for private payments on Aptos. The architecture ensures:

- **Security**: Strong cryptographic primitives and secure key management
- **Privacy**: Unlinkable payments with forward and backward secrecy  
- **Usability**: Seamless integration with existing PIN setup flow
- **Scalability**: Efficient algorithms suitable for production use

The implementation follows best practices for cryptographic key management and provides a solid foundation for building privacy-preserving payment applications on the Aptos blockchain.
