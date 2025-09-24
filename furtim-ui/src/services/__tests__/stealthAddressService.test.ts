/**
 * Frontend tests for Stealth Address Service
 * Tests the client-side stealth address functionality
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { stealthAddressService } from '../stealthAddressService';

// Mock crypto.subtle for testing
const mockCrypto = {
  subtle: {
    importKey: jest.fn(),
    deriveBits: jest.fn(),
    digest: jest.fn(),
    deriveKey: jest.fn(),
    exportKey: jest.fn(),
  },
  getRandomValues: jest.fn(),
};

// Mock global crypto
Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true,
});

describe('StealthAddressService (Frontend)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockCrypto.subtle.importKey.mockResolvedValue({});
    mockCrypto.subtle.deriveBits.mockResolvedValue(new ArrayBuffer(32));
    mockCrypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32));
    mockCrypto.subtle.deriveKey.mockResolvedValue({});
    mockCrypto.subtle.exportKey.mockResolvedValue(new ArrayBuffer(32));
    mockCrypto.getRandomValues.mockImplementation((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    });
  });

  describe('Meta Keys Generation', () => {
    it('should generate meta keys from PIN and signature', async () => {
      const testPin = '1234';
      const testSignature = 'test_signature_12345';

      const metaKeys = await stealthAddressService.generateMetaKeys(testPin, testSignature);
      
      expect(metaKeys).toBeDefined();
      expect(metaKeys.scanPrivateKey).toBeInstanceOf(Uint8Array);
      expect(metaKeys.scanPublicKey).toBeInstanceOf(Uint8Array);
      expect(metaKeys.spendPrivateKey).toBeInstanceOf(Uint8Array);
      expect(metaKeys.spendPublicKey).toBeInstanceOf(Uint8Array);
    });

    it('should generate deterministic keys for same inputs', async () => {
      const testPin = '1234';
      const testSignature = 'test_signature_12345';

      const metaKeys1 = await stealthAddressService.generateMetaKeys(testPin, testSignature);
      const metaKeys2 = await stealthAddressService.generateMetaKeys(testPin, testSignature);
      
      expect(metaKeys1.scanPrivateKey).toEqual(metaKeys2.scanPrivateKey);
      expect(metaKeys1.scanPublicKey).toEqual(metaKeys2.scanPublicKey);
      expect(metaKeys1.spendPrivateKey).toEqual(metaKeys2.spendPrivateKey);
      expect(metaKeys1.spendPublicKey).toEqual(metaKeys2.spendPublicKey);
    });

    it('should generate different keys for different inputs', async () => {
      const metaKeys1 = await stealthAddressService.generateMetaKeys('1234', 'sig1');
      const metaKeys2 = await stealthAddressService.generateMetaKeys('5678', 'sig1');
      
      expect(metaKeys1.scanPrivateKey).not.toEqual(metaKeys2.scanPrivateKey);
      expect(metaKeys1.scanPublicKey).not.toEqual(metaKeys2.scanPublicKey);
    });

    it('should validate generated meta keys', async () => {
      const metaKeys = await stealthAddressService.generateMetaKeys('1234', 'test_sig');
      const isValid = await stealthAddressService.validateMetaKeys(metaKeys);
      
      expect(isValid).toBe(true);
    });
  });

  describe('Ephemeral Key Generation', () => {
    it('should create ephemeral keypair', async () => {
      const ephemeralKeyPair = await stealthAddressService.createEphemeralKeyPair();
      
      expect(ephemeralKeyPair).toBeDefined();
      expect(ephemeralKeyPair.privateKey).toBeInstanceOf(Uint8Array);
      expect(ephemeralKeyPair.publicKey).toBeInstanceOf(Uint8Array);
      expect(ephemeralKeyPair.privateKey.length).toBe(32);
      expect(ephemeralKeyPair.publicKey.length).toBe(32);
    });

    it('should create different ephemeral keys each time', async () => {
      const keyPair1 = await stealthAddressService.createEphemeralKeyPair();
      const keyPair2 = await stealthAddressService.createEphemeralKeyPair();
      
      expect(keyPair1.privateKey).not.toEqual(keyPair2.privateKey);
      expect(keyPair1.publicKey).not.toEqual(keyPair2.publicKey);
    });
  });

  describe('Stealth Address Derivation', () => {
    let recipientMetaKeys: any;
    let ephemeralKeyPair: any;

    beforeEach(async () => {
      recipientMetaKeys = await stealthAddressService.generateMetaKeys('1234', 'test_sig');
      ephemeralKeyPair = await stealthAddressService.createEphemeralKeyPair();
    });

    it('should derive stealth address from meta keys and ephemeral key', async () => {
      const stealthAddress = await stealthAddressService.deriveStealthAddress(
        recipientMetaKeys,
        ephemeralKeyPair.privateKey
      );
      
      expect(stealthAddress).toBeDefined();
      expect(stealthAddress.address).toBeDefined();
      expect(stealthAddress.ephemeralPublicKey).toBeInstanceOf(Uint8Array);
      expect(stealthAddress.sharedSecret).toBeInstanceOf(Uint8Array);
      
      // Check that address is a valid format
      expect(stealthAddress.address).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it('should generate different stealth addresses for different ephemeral keys', async () => {
      const ephemeralKeyPair2 = await stealthAddressService.createEphemeralKeyPair();
      
      const stealthAddress1 = await stealthAddressService.deriveStealthAddress(
        recipientMetaKeys,
        ephemeralKeyPair.privateKey
      );
      
      const stealthAddress2 = await stealthAddressService.deriveStealthAddress(
        recipientMetaKeys,
        ephemeralKeyPair2.privateKey
      );
      
      expect(stealthAddress1.address).not.toEqual(stealthAddress2.address);
    });
  });

  describe('Stealth Private Key Computation', () => {
    let recipientMetaKeys: any;
    let ephemeralKeyPair: any;
    let stealthAddress: any;

    beforeEach(async () => {
      recipientMetaKeys = await stealthAddressService.generateMetaKeys('1234', 'test_sig');
      ephemeralKeyPair = await stealthAddressService.createEphemeralKeyPair();
      stealthAddress = await stealthAddressService.deriveStealthAddress(
        recipientMetaKeys,
        ephemeralKeyPair.privateKey
      );
    });

    it('should compute stealth private key for recipient', async () => {
      const stealthPrivateKey = await stealthAddressService.computeStealthPrivateKey(
        recipientMetaKeys,
        stealthAddress.ephemeralPublicKey
      );
      
      expect(stealthPrivateKey).toBeDefined();
      expect(stealthPrivateKey).toBeInstanceOf(Uint8Array);
      expect(stealthPrivateKey.length).toBe(32);
    });

    it('should generate same stealth private key for same inputs', async () => {
      const stealthPrivateKey1 = await stealthAddressService.computeStealthPrivateKey(
        recipientMetaKeys,
        stealthAddress.ephemeralPublicKey
      );
      
      const stealthPrivateKey2 = await stealthAddressService.computeStealthPrivateKey(
        recipientMetaKeys,
        stealthAddress.ephemeralPublicKey
      );
      
      expect(stealthPrivateKey1).toEqual(stealthPrivateKey2);
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize meta keys', async () => {
      const metaKeys = await stealthAddressService.generateMetaKeys('1234', 'test_sig');
      
      const serialized = stealthAddressService.serializeMetaKeys(metaKeys);
      expect(serialized).toBeDefined();
      expect(typeof serialized).toBe('string');
      
      const deserialized = stealthAddressService.deserializeMetaKeys(serialized);
      expect(deserialized).toBeDefined();
      expect(deserialized.scanPrivateKey).toEqual(metaKeys.scanPrivateKey);
      expect(deserialized.scanPublicKey).toEqual(metaKeys.scanPublicKey);
      expect(deserialized.spendPrivateKey).toEqual(metaKeys.spendPrivateKey);
      expect(deserialized.spendPublicKey).toEqual(metaKeys.spendPublicKey);
    });
  });

  describe('Error Handling', () => {
    it('should handle crypto API errors', async () => {
      mockCrypto.subtle.importKey.mockRejectedValue(new Error('Crypto API Error'));
      
      await expect(
        stealthAddressService.generateMetaKeys('1234', 'test_sig')
      ).rejects.toThrow();
    });

    it('should handle invalid meta keys validation', async () => {
      const invalidMetaKeys = {
        scanPrivateKey: new Uint8Array(0),
        scanPublicKey: new Uint8Array(0),
        spendPrivateKey: new Uint8Array(0),
        spendPublicKey: new Uint8Array(0),
      };
      
      const isValid = await stealthAddressService.validateMetaKeys(invalidMetaKeys);
      expect(isValid).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should generate meta keys within reasonable time', async () => {
      const startTime = Date.now();
      await stealthAddressService.generateMetaKeys('1234', 'test_sig');
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second in tests
    });
  });
});