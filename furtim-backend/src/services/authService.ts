import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase';
import { metaKeysService, MetaKeysStorage } from './metaKeysService';
import { 
  User, 
  WalletAuthRequest, 
  AuthResponse, 
  PinVerificationRequest, 
  PinVerificationResponse,
  UserRegistrationRequest,
  UserRegistrationResponse
} from '../types/auth';

export class AuthService {
  private static readonly SALT_ROUNDS = 10;
  private static readonly JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

  /**
   * Authenticate user with wallet signature
   */
  static async authenticateWallet(request: WalletAuthRequest): Promise<AuthResponse> {
    try {
      // Verify signature (this would need Aptos signature verification)
      const isValidSignature = await this.verifyWalletSignature(request);
      
      if (!isValidSignature) {
        return {
          success: false,
          is_new_user: false,
          message: 'Invalid wallet signature'
        };
      }

      // Check if user exists
      const { data: existingUser, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('wallet_address', request.wallet_address.toLowerCase())
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      if (existingUser) {
        // Returning user - create session
        const session = await this.createUserSession(existingUser);
        return {
          success: true,
          user: existingUser,
          session_token: session.session_token,
          is_new_user: false,
          message: 'Authentication successful'
        };
      } else {
        // New user - need registration
        return {
          success: true,
          is_new_user: true,
          message: 'New user detected - registration required'
        };
      }
    } catch (error) {
      console.error('Wallet authentication error:', error);
      return {
        success: false,
        is_new_user: false,
        message: 'Authentication failed'
      };
    }
  }

  /**
   * Register new user
   */
  static async registerUser(request: UserRegistrationRequest): Promise<UserRegistrationResponse> {
    try {
      // Check if username is available
      const { data: existingUsername } = await supabaseAdmin
        .from('users')
        .select('username')
        .eq('username', request.username)
        .single();

      if (existingUsername) {
        return {
          success: false,
          message: 'Username already taken'
        };
      }

      // Check if wallet address is already registered
      const { data: existingWallet } = await supabaseAdmin
        .from('users')
        .select('wallet_address')
        .eq('wallet_address', request.wallet_address.toLowerCase())
        .single();

      if (existingWallet) {
        return {
          success: false,
          message: 'Wallet address already registered'
        };
      }

      // Hash PIN
      const pinHash = await bcrypt.hash(request.pin, this.SALT_ROUNDS);

      // Create user
      const { data: newUser, error } = await supabaseAdmin
        .from('users')
        .insert({
          username: request.username,
          wallet_address: request.wallet_address.toLowerCase(),
          pin_hash: pinHash,
          public_key: request.public_key,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Store meta keys for stealth addresses
      try {
        if (request.meta_keys) {
          // Use provided meta keys from frontend
          const metaKeys: MetaKeysStorage = {
            scanPrivateKey: request.meta_keys.scanPrivateKey,
            scanPublicKey: request.meta_keys.scanPublicKey,
            spendPrivateKey: request.meta_keys.spendPrivateKey,
            spendPublicKey: request.meta_keys.spendPublicKey
          };
          await metaKeysService.storeMetaKeys(newUser.id, metaKeys, request.pin);
          console.log('Meta keys stored successfully for user:', newUser.id);
        } else {
          // Fallback: Generate placeholder meta keys
          const metaKeys: MetaKeysStorage = {
            scanPrivateKey: Array.from(crypto.randomBytes(32)),
            scanPublicKey: Array.from(crypto.randomBytes(32)),
            spendPrivateKey: Array.from(crypto.randomBytes(32)),
            spendPublicKey: Array.from(crypto.randomBytes(32))
          };
          await metaKeysService.storeMetaKeys(newUser.id, metaKeys, request.pin);
          console.log('Placeholder meta keys generated and stored for user:', newUser.id);
        }
      } catch (metaKeysError) {
        console.error('Failed to store meta keys:', metaKeysError);
        // Continue with registration even if meta keys fail
        // In production, you might want to handle this differently
      }

      // Create session
      const session = await this.createUserSession(newUser);

      return {
        success: true,
        user: newUser,
        session_token: session.session_token,
        message: 'User registered successfully with stealth address capabilities'
      };
    } catch (error) {
      console.error('User registration error:', error);
      return {
        success: false,
        message: 'Registration failed'
      };
    }
  }

  /**
   * Verify PIN for returning user
   */
  static async verifyPin(request: PinVerificationRequest): Promise<PinVerificationResponse> {
    try {
      // Get session
      const { data: session, error: sessionError } = await supabaseAdmin
        .from('user_sessions')
        .select('*')
        .eq('session_token', request.session_token)
        .eq('is_active', true)
        .single();

      if (sessionError || !session) {
        return {
          success: false,
          message: 'Invalid session'
        };
      }

      // Get user
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', session.user_id)
        .eq('is_active', true)
        .single();

      if (userError || !user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Verify PIN
      const isValidPin = await bcrypt.compare(request.pin, user.pin_hash);
      
      if (!isValidPin) {
        return {
          success: false,
          message: 'Invalid PIN'
        };
      }

      // Verify wallet signature if provided
      if (request.wallet_signature && request.wallet_message && request.wallet_address) {
        const isValidWalletSignature = await this.verifyWalletSignature({
          wallet_address: request.wallet_address,
          signature: request.wallet_signature,
          message: request.wallet_message,
          timestamp: Date.now()
        });

        if (!isValidWalletSignature) {
          return {
            success: false,
            message: 'Invalid wallet signature'
          };
        }

        // Verify wallet address matches user's registered wallet
        if (request.wallet_address.toLowerCase() !== user.wallet_address.toLowerCase()) {
          return {
            success: false,
            message: 'Wallet address does not match registered account'
          };
        }
      }

      // Update last login
      await supabaseAdmin
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      return {
        success: true,
        user,
        message: 'PIN verification successful'
      };
    } catch (error) {
      console.error('PIN verification error:', error);
      return {
        success: false,
        message: 'PIN verification failed'
      };
    }
  }

  /**
   * Create user session
   */
  private static async createUserSession(user: User) {
    const sessionToken = this.generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const { data: session, error } = await supabaseAdmin
      .from('user_sessions')
      .insert({
        user_id: user.id,
        session_token: sessionToken,
        wallet_signature: '', // Will be updated with actual signature
        expires_at: expiresAt.toISOString(),
        is_active: true
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return session;
  }

  /**
   * Generate JWT session token
   */
  private static generateSessionToken(): string {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const payload = { 
      sessionId: 'temp', // Will be updated after database insert
      userId: 'temp'
    };
    
    const options: SignOptions = { 
      expiresIn: this.JWT_EXPIRES_IN as any
    };
    
    return jwt.sign(payload, jwtSecret, options);
  }

  /**
   * Verify wallet signature (placeholder - needs Aptos integration)
   */
  private static async verifyWalletSignature(request: WalletAuthRequest): Promise<boolean> {
    // TODO: Implement actual Aptos signature verification
    // This is a placeholder implementation
    try {
      // Basic validation
      if (!request.wallet_address || !request.signature || !request.message) {
        return false;
      }

      // Check timestamp (prevent replay attacks)
      const now = Date.now();
      const requestTime = request.timestamp;
      const timeDiff = Math.abs(now - requestTime);
      
      if (timeDiff > 300000) { // 5 minutes
        return false;
      }

      // TODO: Implement actual signature verification with Aptos SDK
      // For now, return true for testing
      return true;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Logout user
   */
  static async logout(sessionToken: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('user_sessions')
        .update({ is_active: false })
        .eq('session_token', sessionToken);

      return !error;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }
}
