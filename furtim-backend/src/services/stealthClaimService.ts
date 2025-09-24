/**
 * Stealth Address Claim Service
 * 
 * Handles the hybrid claim flow for stealth address payments.
 * Combines backend scanning with frontend claiming functionality.
 */

import { Aptos, Network, Account } from '@aptos-labs/ts-sdk';
import { supabaseAdmin } from '../config/supabase';
import { metaKeysService } from './metaKeysService';
import { stealthAddressService } from './stealthAddressService';
import { getContractConfig, getContractFunctions } from '../config/contracts';

export interface ClaimablePayment {
  id: string;
  paymentId: number;
  stealthAddress: string;
  amount: number;
  coinType: string;
  txHash: string;
  blockNumber: number;
  createdAt: string;
  ephemeralPublicKey?: string;
}

export interface ClaimRequest {
  userId: string;
  paymentId: number;
  stealthAddress: string;
  ephemeralPublicKey: string;
  sharedSecretProof: string;
}

export interface ClaimResponse {
  success: boolean;
  message: string;
  txHash?: string;
  claimedAmount?: number;
}

export class StealthClaimService {
  private aptos: Aptos;

  constructor() {
    const config = getContractConfig();
    this.aptos = new Aptos({
      network: config.network as Network,
      fullnode: config.rpcUrl,
    });
  }

  /**
   * Scan for claimable payments for a user
   */
  async scanForClaimablePayments(userId: string): Promise<ClaimablePayment[]> {
    try {
      console.log(`🔍 Scanning for claimable payments for user: ${userId}`);

      // Get user's meta keys
      const user = await this.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get user's stealth addresses
      const stealthAddresses = await this.getUserStealthAddresses(userId);
      if (stealthAddresses.length === 0) {
        console.log('📭 No stealth addresses found for user');
        return [];
      }

      // Get unclaimed transactions for user's stealth addresses
      const { data: transactions, error } = await supabaseAdmin
        .from('stealth_transactions')
        .select('*')
        .in('stealth_address', stealthAddresses)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const claimablePayments: ClaimablePayment[] = [];

      for (const tx of transactions || []) {
        // Verify that the user can claim this payment
        const canClaim = await this.verifyClaimability(userId, tx);
        if (canClaim) {
          claimablePayments.push({
            id: tx.id,
            paymentId: tx.payment_id,
            stealthAddress: tx.stealth_address,
            amount: parseFloat(tx.amount),
            coinType: tx.coin_type,
            txHash: tx.tx_hash,
            blockNumber: tx.block_number,
            createdAt: tx.created_at,
            ephemeralPublicKey: tx.ephemeral_public_key,
          });
        }
      }

      console.log(`✅ Found ${claimablePayments.length} claimable payments`);
      return claimablePayments;

    } catch (error) {
      console.error('❌ Error scanning for claimable payments:', error);
      return [];
    }
  }

  /**
   * Claim a stealth payment
   */
  async claimPayment(claimRequest: ClaimRequest): Promise<ClaimResponse> {
    try {
      console.log(`🎯 Claiming payment ${claimRequest.paymentId} for user ${claimRequest.userId}`);

      // Verify the claim request
      const isValidClaim = await this.verifyClaimRequest(claimRequest);
      if (!isValidClaim) {
        return {
          success: false,
          message: 'Invalid claim request or insufficient permissions',
        };
      }

      // Get user's account for signing
      const userAccount = await this.getUserAccount(claimRequest.userId);
      if (!userAccount) {
        return {
          success: false,
          message: 'User account not found',
        };
      }

      // Generate the claim transaction
      const claimTx = await this.generateClaimTransaction(claimRequest);
      
      // Submit the claim transaction
      const result = await this.submitClaimTransaction(userAccount, claimTx);

      if (result.success) {
        // Update the transaction status in database
        await this.updateTransactionStatus(claimRequest.paymentId, 'claimed', result.txHash);
        
        // Update user's stealth balance
        await this.updateUserStealthBalance(claimRequest.userId, claimRequest.stealthAddress, claimRequest.amount);

        return {
          success: true,
          message: 'Payment claimed successfully',
          txHash: result.txHash,
          claimedAmount: claimRequest.amount,
        };
      } else {
        return {
          success: false,
          message: result.message || 'Failed to claim payment',
        };
      }

    } catch (error) {
      console.error('❌ Error claiming payment:', error);
      return {
        success: false,
        message: 'Internal error during claim process',
      };
    }
  }

  /**
   * Verify that a user can claim a specific payment
   */
  private async verifyClaimability(userId: string, transaction: any): Promise<boolean> {
    try {
      // Check if user has the required meta keys
      const hasMetaKeys = await metaKeysService.hasMetaKeys(userId);
      if (!hasMetaKeys) {
        return false;
      }

      // TODO: Implement cryptographic verification
      // This would involve:
      // 1. Getting user's scan private key
      // 2. Computing shared secret with ephemeral public key
      // 3. Verifying the shared secret proof
      
      return true; // Placeholder for now
    } catch (error) {
      console.error('❌ Error verifying claimability:', error);
      return false;
    }
  }

  /**
   * Verify a claim request
   */
  private async verifyClaimRequest(claimRequest: ClaimRequest): Promise<boolean> {
    try {
      // Check if payment exists and is claimable
      const { data: payment, error } = await supabaseAdmin
        .from('stealth_transactions')
        .select('*')
        .eq('payment_id', claimRequest.paymentId)
        .eq('stealth_address', claimRequest.stealthAddress)
        .eq('status', 'pending')
        .single();

      if (error || !payment) {
        return false;
      }

      // Verify the shared secret proof
      const isValidProof = await this.verifySharedSecretProof(claimRequest);
      if (!isValidProof) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Error verifying claim request:', error);
      return false;
    }
  }

  /**
   * Verify the shared secret proof
   */
  private async verifySharedSecretProof(claimRequest: ClaimRequest): Promise<boolean> {
    try {
      // Get user's meta keys
      const metaKeys = await metaKeysService.retrieveMetaKeys(claimRequest.userId, 'user_pin');
      
      // Compute shared secret using scan private key and ephemeral public key
      const sharedSecret = await stealthAddressService.computeSharedSecret(
        new Uint8Array(metaKeys.scanPrivateKey),
        new Uint8Array(claimRequest.ephemeralPublicKey.split(',').map(Number))
      );

      // Verify the proof matches the computed shared secret
      // This is a simplified verification - in production, you'd use proper cryptographic verification
      return true; // Placeholder for now
    } catch (error) {
      console.error('❌ Error verifying shared secret proof:', error);
      return false;
    }
  }

  /**
   * Generate claim transaction
   */
  private async generateClaimTransaction(claimRequest: ClaimRequest): Promise<any> {
    // This would generate the actual Move transaction for claiming
    // For now, return a placeholder
    return {
      type: 'entry_function_payload',
      function: 'furtim::stealth_address::claim_stealth_payment',
      arguments: [
        claimRequest.paymentId,
        claimRequest.stealthAddress,
        claimRequest.ephemeralPublicKey,
        claimRequest.sharedSecretProof,
      ],
    };
  }

  /**
   * Submit claim transaction to blockchain
   */
  private async submitClaimTransaction(account: Account, transaction: any): Promise<{ success: boolean; txHash?: string; message?: string }> {
    try {
      const result = await this.aptos.runTransaction({
        account,
        payload: transaction,
      });

      return {
        success: true,
        txHash: result.hash,
      };
    } catch (error) {
      console.error('❌ Error submitting claim transaction:', error);
      return {
        success: false,
        message: error.message || 'Transaction failed',
      };
    }
  }

  /**
   * Update transaction status in database
   */
  private async updateTransactionStatus(paymentId: number, status: string, txHash?: string): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (txHash) {
        updateData.claim_tx_hash = txHash;
        updateData.claimed_at = new Date().toISOString();
      }

      const { error } = await supabaseAdmin
        .from('stealth_transactions')
        .update(updateData)
        .eq('payment_id', paymentId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('❌ Error updating transaction status:', error);
    }
  }

  /**
   * Update user's stealth balance
   */
  private async updateUserStealthBalance(userId: string, stealthAddress: string, amount: number): Promise<void> {
    try {
      // Get current balance
      const { data: balance, error: balanceError } = await supabaseAdmin
        .from('stealth_balances')
        .select('*')
        .eq('user_id', userId)
        .eq('stealth_address', stealthAddress)
        .single();

      if (balanceError && balanceError.code !== 'PGRST116') {
        throw balanceError;
      }

      if (balance) {
        // Update existing balance
        const newBalance = parseFloat(balance.balance) + amount;
        await supabaseAdmin
          .from('stealth_balances')
          .update({
            balance: newBalance,
            last_updated: new Date().toISOString(),
          })
          .eq('id', balance.id);
      } else {
        // Create new balance record
        await supabaseAdmin
          .from('stealth_balances')
          .insert({
            user_id: userId,
            stealth_address: stealthAddress,
            balance: amount,
            coin_type: 'USDC',
            is_active: true,
          });
      }
    } catch (error) {
      console.error('❌ Error updating stealth balance:', error);
    }
  }

  /**
   * Get user by ID
   */
  private async getUser(userId: string): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Get user's stealth addresses
   */
  private async getUserStealthAddresses(userId: string): Promise<string[]> {
    const { data, error } = await supabaseAdmin
      .from('stealth_balances')
      .select('stealth_address')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      throw error;
    }

    return data?.map(item => item.stealth_address) || [];
  }

  /**
   * Get user account for signing
   */
  private async getUserAccount(userId: string): Promise<Account | null> {
    // This would retrieve the user's account for signing
    // In a real implementation, you'd need to securely store and retrieve user's private keys
    // For now, return null as this would need proper key management
    return null;
  }

  /**
   * Get user's stealth balance
   */
  async getUserStealthBalance(userId: string): Promise<number> {
    try {
      const { data, error } = await supabaseAdmin
        .from('stealth_balances')
        .select('balance')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      const totalBalance = data?.reduce((sum, item) => sum + parseFloat(item.balance), 0) || 0;
      return totalBalance;
    } catch (error) {
      console.error('❌ Error getting user stealth balance:', error);
      return 0;
    }
  }

  /**
   * Get user's stealth transaction history
   */
  async getUserStealthHistory(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('stealth_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error getting user stealth history:', error);
      return [];
    }
  }
}

// Export singleton instance
export const stealthClaimService = new StealthClaimService();
