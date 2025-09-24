/**
 * Meta Keys Service
 * 
 * Handles storage and retrieval of user meta keys for stealth address functionality.
 * Meta keys are encrypted before storage and never stored in plain text.
 */

import { supabase } from '../config/supabase';
import crypto from 'crypto';

export interface MetaKeysData {
  scanPublicKey: string;
  spendPublicKey: string;
  metaKeysEncrypted: string;
  encryptionSalt: string;
}

export interface MetaKeysStorage {
  scanPrivateKey: number[];
  scanPublicKey: number[];
  spendPrivateKey: number[];
  spendPublicKey: number[];
}

export class MetaKeysService {
  private readonly ENCRYPTION_ALGORITHM = 'aes-256-cbc';
  private readonly KEY_LENGTH = 32; // 256 bits
  private readonly IV_LENGTH = 16; // 128 bits

  /**
   * Store user meta keys in the database
   * Private keys are encrypted using the user's PIN before storage
   */
  async storeMetaKeys(
    userId: string,
    metaKeys: MetaKeysStorage,
    pin: string
  ): Promise<MetaKeysData> {
    try {
      // Generate encryption salt
      const salt = crypto.randomBytes(16).toString('hex');
      
      // Derive encryption key from PIN + salt
      const encryptionKey = crypto.pbkdf2Sync(pin, salt, 100000, this.KEY_LENGTH, 'sha256');
      
      // Serialize meta keys to JSON
      const metaKeysJson = JSON.stringify(metaKeys);
      
      // Encrypt meta keys
      const encryptedMetaKeys = this.encrypt(metaKeysJson, encryptionKey);
      
      // Prepare public keys for storage
      const scanPublicKey = Buffer.from(metaKeys.scanPublicKey).toString('base64');
      const spendPublicKey = Buffer.from(metaKeys.spendPublicKey).toString('base64');
      
      // Store in database
      const { data, error } = await supabase
        .from('user_meta_keys')
        .insert({
          user_id: userId,
          scan_public_key: scanPublicKey,
          spend_public_key: spendPublicKey,
          meta_keys_encrypted: encryptedMetaKeys,
          encryption_salt: salt,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to store meta keys:', error);
        throw new Error('Failed to store meta keys');
      }

      return {
        scanPublicKey,
        spendPublicKey,
        metaKeysEncrypted: encryptedMetaKeys,
        encryptionSalt: salt
      };
    } catch (error) {
      console.error('Meta keys storage error:', error);
      throw new Error('Failed to store meta keys');
    }
  }

  /**
   * Retrieve and decrypt user meta keys from the database
   */
  async retrieveMetaKeys(userId: string, pin: string): Promise<MetaKeysStorage> {
    try {
      // Get meta keys from database
      const { data, error } = await supabase
        .from('user_meta_keys')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        throw new Error('Meta keys not found');
      }

      // Derive decryption key from PIN + salt
      const encryptionKey = crypto.pbkdf2Sync(
        pin,
        data.encryption_salt,
        100000,
        this.KEY_LENGTH,
        'sha256'
      );

      // Decrypt meta keys
      const decryptedMetaKeys = this.decrypt(data.meta_keys_encrypted, encryptionKey);
      
      // Parse and return meta keys
      return JSON.parse(decryptedMetaKeys);
    } catch (error) {
      console.error('Meta keys retrieval error:', error);
      throw new Error('Failed to retrieve meta keys');
    }
  }

  /**
   * Get user's public meta keys (for creating stealth addresses)
   */
  async getPublicMetaKeys(userId: string): Promise<{ scanPublicKey: string; spendPublicKey: string }> {
    try {
      const { data, error } = await supabase
        .from('user_meta_keys')
        .select('scan_public_key, spend_public_key')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        throw new Error('Public meta keys not found');
      }

      return {
        scanPublicKey: data.scan_public_key,
        spendPublicKey: data.spend_public_key
      };
    } catch (error) {
      console.error('Public meta keys retrieval error:', error);
      throw new Error('Failed to retrieve public meta keys');
    }
  }

  /**
   * Check if user has meta keys stored
   */
  async hasMetaKeys(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_meta_keys')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      return !error && !!data;
    } catch (error) {
      return false;
    }
  }

  /**
   * Deactivate user's meta keys (soft delete)
   */
  async deactivateMetaKeys(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_meta_keys')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('Failed to deactivate meta keys:', error);
        throw new Error('Failed to deactivate meta keys');
      }
    } catch (error) {
      console.error('Meta keys deactivation error:', error);
      throw new Error('Failed to deactivate meta keys');
    }
  }

  /**
   * Encrypt data using AES-256-CBC
   */
  private encrypt(plaintext: string, key: Buffer): string {
    try {
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const cipher = crypto.createCipher(this.ENCRYPTION_ALGORITHM, key);
      cipher.setAutoPadding(true);
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Combine IV + encrypted data
      const combined = Buffer.concat([iv, Buffer.from(encrypted, 'hex')]);
      return combined.toString('base64');
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt data using AES-256-CBC
   */
  private decrypt(encryptedData: string, key: Buffer): string {
    try {
      const combined = Buffer.from(encryptedData, 'base64');
      
      // Extract IV and encrypted data
      const iv = combined.slice(0, this.IV_LENGTH);
      const encrypted = combined.slice(this.IV_LENGTH);
      
      const decipher = crypto.createDecipher(this.ENCRYPTION_ALGORITHM, key);
      decipher.setAutoPadding(true);
      
      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Decryption failed - invalid PIN or corrupted data');
    }
  }

  /**
   * Validate PIN format
   */
  validatePin(pin: string): boolean {
    return /^\d{4}$/.test(pin);
  }

  /**
   * Generate secure random bytes
   */
  generateRandomBytes(length: number): Buffer {
    return crypto.randomBytes(length);
  }

  /**
   * Hash data using SHA-256
   */
  hashData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

// Export singleton instance
export const metaKeysService = new MetaKeysService();
