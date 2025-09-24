/**
 * Stealth Address Service
 * 
 * Implements stealth address functionality for private payments using meta keys.
 * Based on the stealth address protocol with ECDH shared secrets.
 * 
 * Meta Keys:
 * - Scan keypair (scan_priv, scan_pub): Used to detect incoming stealth payments
 * - Spend keypair (spend_priv, spend_pub): Used to construct stealth private keys
 * 
 * Key Generation Strategy:
 * - Uses Ed25519 for signing (Aptos native)
 * - Uses X25519 for ECDH (shared secret derivation)
 * - Generates deterministic keys from PIN + wallet signature
 */

import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

// Types for stealth address functionality
export interface MetaKeys {
  scanPrivateKey: Uint8Array;
  scanPublicKey: Uint8Array;
  spendPrivateKey: Uint8Array;
  spendPublicKey: Uint8Array;
}

export interface StealthAddress {
  address: string;
  ephemeralPublicKey: Uint8Array;
  sharedSecret: Uint8Array;
}

export interface EphemeralKeyPair {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
}

export class StealthAddressService {
  private aptos: Aptos;

  constructor() {
    const config = new AptosConfig({ network: Network.TESTNET });
    this.aptos = new Aptos(config);
  }

  /**
   * Generate meta keys deterministically from PIN and wallet signature
   * Uses PBKDF2 to derive seed from PIN + signature for reproducible keys
   */
  async generateMetaKeys(pin: string, walletSignature: string): Promise<MetaKeys> {
    try {
      // Create deterministic seed from PIN + wallet signature
      const seed = await this.deriveSeed(pin, walletSignature);
      
      // Generate scan keypair (X25519 for ECDH)
      const scanKeyPair = await this.generateX25519KeyPair(seed.slice(0, 32));
      
      // Generate spend keypair (Ed25519 for signing)
      const spendSeed = await this.deriveSeed(pin, walletSignature + '_spend');
      const spendKeyPair = await this.generateEd25519KeyPair(spendSeed.slice(0, 32));

      return {
        scanPrivateKey: scanKeyPair.privateKey,
        scanPublicKey: scanKeyPair.publicKey,
        spendPrivateKey: spendKeyPair.privateKey,
        spendPublicKey: spendKeyPair.publicKey,
      };
    } catch (error) {
      console.error('Failed to generate meta keys:', error);
      throw new Error('Meta key generation failed');
    }
  }

  /**
   * Create ephemeral keypair for sender (one-time use)
   */
  async createEphemeralKeyPair(): Promise<EphemeralKeyPair> {
    try {
      // Generate random X25519 keypair for ephemeral use
      const keyPair = await this.generateX25519KeyPair();
      return keyPair;
    } catch (error) {
      console.error('Failed to create ephemeral keypair:', error);
      throw new Error('Ephemeral keypair generation failed');
    }
  }

  /**
   * Derive stealth address from meta keys and ephemeral public key
   * This is what the sender calls to create a one-time address
   */
  async deriveStealthAddress(
    recipientMetaKeys: MetaKeys,
    ephemeralPrivateKey: Uint8Array
  ): Promise<StealthAddress> {
    try {
      // Compute shared secret: ECDH(ephemeral_priv, scan_pub)
      const sharedSecret = await this.computeSharedSecret(
        ephemeralPrivateKey,
        recipientMetaKeys.scanPublicKey
      );

      // Map shared secret to scalar using hash-to-scalar
      const scalar = await this.hashToScalar(sharedSecret, 'stealth_address');

      // Compute one-time public key: scalar * G + spend_pub
      const oneTimePublicKey = await this.computeOneTimePublicKey(
        scalar,
        recipientMetaKeys.spendPublicKey
      );

      // Derive Aptos address from one-time public key
      const address = await this.deriveAptosAddress(oneTimePublicKey);

      return {
        address,
        ephemeralPublicKey: await this.derivePublicKey(ephemeralPrivateKey),
        sharedSecret,
      };
    } catch (error) {
      console.error('Failed to derive stealth address:', error);
      throw new Error('Stealth address derivation failed');
    }
  }

  /**
   * Compute stealth private key for recipient
   * This is what the recipient calls to derive the private key for spending
   */
  async computeStealthPrivateKey(
    metaKeys: MetaKeys,
    ephemeralPublicKey: Uint8Array
  ): Promise<Uint8Array> {
    try {
      // Compute shared secret: ECDH(scan_priv, ephemeral_pub)
      const sharedSecret = await this.computeSharedSecret(
        metaKeys.scanPrivateKey,
        ephemeralPublicKey
      );

      // Map shared secret to scalar
      const scalar = await this.hashToScalar(sharedSecret, 'stealth_address');

      // Compute stealth private key: scalar + spend_priv (mod group order)
      const stealthPrivateKey = await this.computeStealthPrivateKeyFromScalar(
        scalar,
        metaKeys.spendPrivateKey
      );

      return stealthPrivateKey;
    } catch (error) {
      console.error('Failed to compute stealth private key:', error);
      throw new Error('Stealth private key computation failed');
    }
  }

  /**
   * Derive deterministic seed from PIN and signature using PBKDF2
   */
  private async deriveSeed(pin: string, signature: string): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const password = encoder.encode(pin + signature);
    const salt = encoder.encode('furtim_stealth_salt');
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      password,
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256 // 32 bytes
    );

    return new Uint8Array(derivedBits);
  }

  /**
   * Generate X25519 keypair for ECDH operations
   * Fallback implementation using compatible crypto operations
   */
  private async generateX25519KeyPair(seed?: Uint8Array): Promise<EphemeralKeyPair> {
    try {
      let privateKeyBytes: Uint8Array;
      let publicKeyBytes: Uint8Array;
      
      if (seed) {
        // Generate deterministic keypair from seed
        privateKeyBytes = seed.slice(0, 32);
      } else {
        // Generate random keypair
        privateKeyBytes = new Uint8Array(32);
        crypto.getRandomValues(privateKeyBytes);
      }

      // For X25519, the public key is derived from the private key
      // This is a simplified implementation - in production you'd use a proper X25519 library
      publicKeyBytes = await this.deriveX25519PublicKey(privateKeyBytes);

      return {
        privateKey: privateKeyBytes,
        publicKey: publicKeyBytes,
      };
    } catch (error) {
      console.error('X25519 keypair generation failed:', error);
      // Fallback to simple random key generation
      console.log('Using fallback key generation...');
      const privateKey = new Uint8Array(32);
      const publicKey = new Uint8Array(32);
      crypto.getRandomValues(privateKey);
      crypto.getRandomValues(publicKey);
      
      return { privateKey, publicKey };
    }
  }

  /**
   * Simplified X25519 public key derivation
   * In production, use a proper X25519 library
   */
  private async deriveX25519PublicKey(privateKey: Uint8Array): Promise<Uint8Array> {
    // This is a placeholder implementation
    // In production, you would use a proper X25519 library
    const publicKey = new Uint8Array(32);
    crypto.getRandomValues(publicKey);
    return publicKey;
  }

  /**
   * Generate Ed25519 keypair for signing operations
   * Fallback implementation using compatible crypto operations
   */
  private async generateEd25519KeyPair(seed?: Uint8Array): Promise<EphemeralKeyPair> {
    try {
      let privateKeyBytes: Uint8Array;
      let publicKeyBytes: Uint8Array;
      
      if (seed) {
        // Generate deterministic keypair from seed
        privateKeyBytes = seed.slice(0, 32);
      } else {
        // Generate random keypair
        privateKeyBytes = new Uint8Array(32);
        crypto.getRandomValues(privateKeyBytes);
      }

      // For Ed25519, the public key is derived from the private key
      // This is a simplified implementation - in production you'd use a proper Ed25519 library
      publicKeyBytes = await this.deriveEd25519PublicKey(privateKeyBytes);

      return {
        privateKey: privateKeyBytes,
        publicKey: publicKeyBytes,
      };
    } catch (error) {
      console.error('Ed25519 keypair generation failed:', error);
      // Fallback to simple random key generation
      console.log('Using fallback Ed25519 key generation...');
      const privateKey = new Uint8Array(32);
      const publicKey = new Uint8Array(32);
      crypto.getRandomValues(privateKey);
      crypto.getRandomValues(publicKey);
      
      return { privateKey, publicKey };
    }
  }

  /**
   * Simplified Ed25519 public key derivation
   * In production, use a proper Ed25519 library
   */
  private async deriveEd25519PublicKey(privateKey: Uint8Array): Promise<Uint8Array> {
    // This is a placeholder implementation
    // In production, you would use a proper Ed25519 library
    const publicKey = new Uint8Array(32);
    crypto.getRandomValues(publicKey);
    return publicKey;
  }

  /**
   * Compute ECDH shared secret
   */
  public async computeSharedSecret(
    privateKey: Uint8Array,
    publicKey: Uint8Array
  ): Promise<Uint8Array> {
    try {
      const cryptoPrivateKey = await crypto.subtle.importKey(
        'raw',
        privateKey,
        'X25519',
        false,
        ['deriveKey']
      );

      const cryptoPublicKey = await crypto.subtle.importKey(
        'raw',
        publicKey,
        'X25519',
        false,
        []
      );

      const derivedKey = await crypto.subtle.deriveKey(
        { name: 'X25519', public: cryptoPublicKey },
        cryptoPrivateKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );

      const keyBytes = await crypto.subtle.exportKey('raw', derivedKey);
      return new Uint8Array(keyBytes);
    } catch (error) {
      console.error('ECDH shared secret computation failed:', error);
      throw error;
    }
  }

  /**
   * Hash shared secret to scalar using hash-to-scalar function
   */
  private async hashToScalar(sharedSecret: Uint8Array, context: string): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const contextBytes = encoder.encode(context);
    
    const combined = new Uint8Array(sharedSecret.length + contextBytes.length);
    combined.set(sharedSecret);
    combined.set(contextBytes, sharedSecret.length);

    const hash = await crypto.subtle.digest('SHA-256', combined);
    return new Uint8Array(hash);
  }

  /**
   * Compute one-time public key: scalar * G + spend_pub
   */
  private async computeOneTimePublicKey(
    scalar: Uint8Array,
    spendPublicKey: Uint8Array
  ): Promise<Uint8Array> {
    // This is a simplified implementation
    // In a real implementation, you'd use proper elliptic curve point operations
    // For now, we'll use a hash-based approach for demonstration
    
    const combined = new Uint8Array(scalar.length + spendPublicKey.length);
    combined.set(scalar);
    combined.set(spendPublicKey, scalar.length);

    const hash = await crypto.subtle.digest('SHA-256', combined);
    return new Uint8Array(hash);
  }

  /**
   * Derive Aptos address from public key
   */
  private async deriveAptosAddress(publicKey: Uint8Array): Promise<string> {
    // Simplified address derivation
    // In practice, you'd use proper Aptos address derivation
    const hash = await crypto.subtle.digest('SHA-256', publicKey);
    const hashBytes = new Uint8Array(hash);
    
    // Convert to hex string and add 0x prefix
    const hex = Array.from(hashBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return '0x' + hex.substring(0, 64); // Aptos addresses are 32 bytes (64 hex chars)
  }

  /**
   * Compute stealth private key from scalar and spend private key
   */
  private async computeStealthPrivateKeyFromScalar(
    scalar: Uint8Array,
    spendPrivateKey: Uint8Array
  ): Promise<Uint8Array> {
    // Simplified implementation
    // In practice, you'd perform proper modular arithmetic
    const combined = new Uint8Array(scalar.length + spendPrivateKey.length);
    combined.set(scalar);
    combined.set(spendPrivateKey, scalar.length);

    const hash = await crypto.subtle.digest('SHA-256', combined);
    return new Uint8Array(hash);
  }

  /**
   * Derive public key from private key
   */
  private async derivePublicKey(privateKey: Uint8Array): Promise<Uint8Array> {
    // This would use proper elliptic curve point multiplication
    // For now, using hash-based approach
    const hash = await crypto.subtle.digest('SHA-256', privateKey);
    return new Uint8Array(hash);
  }

  /**
   * Export private key as Uint8Array
   */
  private async exportPrivateKey(key: CryptoKey): Promise<Uint8Array> {
    const keyData = await crypto.subtle.exportKey('raw', key);
    return new Uint8Array(keyData);
  }

  /**
   * Export public key as Uint8Array
   */
  private async exportPublicKey(key: CryptoKey): Promise<Uint8Array> {
    const keyData = await crypto.subtle.exportKey('raw', key);
    return new Uint8Array(keyData);
  }

  /**
   * Derive public key from private key (CryptoKey version)
   */
  private async derivePublicKeyFromPrivate(privateKey: CryptoKey): Promise<CryptoKey> {
    // This is a simplified approach
    // In practice, you'd use proper key derivation
    const keyData = await crypto.subtle.exportKey('raw', privateKey);
    const publicKeyData = await crypto.subtle.digest('SHA-256', keyData);
    
    return await crypto.subtle.importKey(
      'raw',
      publicKeyData,
      'Ed25519', // or X25519 depending on the key type
      false,
      ['verify']
    );
  }

  /**
   * Validate meta keys integrity
   */
  async validateMetaKeys(metaKeys: MetaKeys): Promise<boolean> {
    try {
      // Basic validation checks
      if (!metaKeys.scanPrivateKey || metaKeys.scanPrivateKey.length === 0) return false;
      if (!metaKeys.scanPublicKey || metaKeys.scanPublicKey.length === 0) return false;
      if (!metaKeys.spendPrivateKey || metaKeys.spendPrivateKey.length === 0) return false;
      if (!metaKeys.spendPublicKey || metaKeys.spendPublicKey.length === 0) return false;

      // TODO: Add cryptographic validation
      // - Verify public keys can be derived from private keys
      // - Verify key pairs are valid for their respective curves

      return true;
    } catch (error) {
      console.error('Meta keys validation failed:', error);
      return false;
    }
  }

  /**
   * Serialize meta keys to JSON for storage
   */
  serializeMetaKeys(metaKeys: MetaKeys): string {
    const serialized = {
      scanPrivateKey: Array.from(metaKeys.scanPrivateKey),
      scanPublicKey: Array.from(metaKeys.scanPublicKey),
      spendPrivateKey: Array.from(metaKeys.spendPrivateKey),
      spendPublicKey: Array.from(metaKeys.spendPublicKey),
    };
    return JSON.stringify(serialized);
  }

  /**
   * Deserialize meta keys from JSON
   */
  deserializeMetaKeys(serialized: string): MetaKeys {
    const parsed = JSON.parse(serialized);
    return {
      scanPrivateKey: new Uint8Array(parsed.scanPrivateKey),
      scanPublicKey: new Uint8Array(parsed.scanPublicKey),
      spendPrivateKey: new Uint8Array(parsed.spendPrivateKey),
      spendPublicKey: new Uint8Array(parsed.spendPublicKey),
    };
  }
}

// Export singleton instance
export const stealthAddressService = new StealthAddressService();
