/**
 * Stealth Address Indexer Service
 * 
 * Monitors the Aptos blockchain for stealth address transactions and events.
 * Processes stealth payments and updates the database accordingly.
 */

import { Aptos, Network } from '@aptos-labs/ts-sdk';
import { supabaseAdmin } from '../config/supabase';
import { stealthAddressService } from './stealthAddressService';
import { getContractConfig, getContractFunctions } from '../config/contracts';

export interface StealthTransaction {
  id: string;
  stealthAddress: string;
  ephemeralPublicKey: string;
  amount: number;
  coinType: string;
  txHash: string;
  blockNumber: number;
  timestamp: number;
  senderAddress: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface StealthEvent {
  type: 'payment_created' | 'payment_claimed';
  paymentId: number;
  stealthAddress: string;
  amount?: number;
  coinType?: string;
  claimedBy?: string;
  timestamp: number;
  txHash: string;
}

export class StealthIndexerService {
  private aptos: Aptos;
  private isRunning: boolean = false;
  private lastProcessedVersion: number = 0;
  private readonly BATCH_SIZE = 100;
  private readonly POLL_INTERVAL = 5000; // 5 seconds

  constructor() {
    const config = getContractConfig();
    this.aptos = new Aptos({
      network: config.network as Network,
      fullnode: config.rpcUrl,
    });
  }

  /**
   * Start the stealth address indexer
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️  Stealth indexer is already running');
      return;
    }

    console.log('🚀 Starting stealth address indexer...');
    this.isRunning = true;

    // Get the last processed version from database
    await this.loadLastProcessedVersion();

    // Start polling for new transactions
    this.startPolling();
  }

  /**
   * Stop the stealth address indexer
   */
  async stop(): Promise<void> {
    console.log('🛑 Stopping stealth address indexer...');
    this.isRunning = false;
  }

  /**
   * Load the last processed version from database
   */
  private async loadLastProcessedVersion(): Promise<void> {
    try {
      const { data, error } = await supabaseAdmin
        .from('indexer_state')
        .select('last_processed_version')
        .eq('indexer_type', 'stealth_address')
        .single();

      if (data && !error) {
        this.lastProcessedVersion = data.last_processed_version;
        console.log(`📊 Starting from version: ${this.lastProcessedVersion}`);
      } else {
        // Get current ledger version as starting point
        const ledgerInfo = await this.aptos.getLedgerInfo();
        this.lastProcessedVersion = parseInt(ledgerInfo.ledger_version) - 1000; // Start from 1000 blocks ago
        console.log(`📊 Starting from version: ${this.lastProcessedVersion}`);
      }
    } catch (error) {
      console.error('❌ Failed to load last processed version:', error);
      // Start from current ledger version
      const ledgerInfo = await this.aptos.getLedgerInfo();
      this.lastProcessedVersion = parseInt(ledgerInfo.ledger_version) - 1000;
    }
  }

  /**
   * Save the last processed version to database
   */
  private async saveLastProcessedVersion(version: number): Promise<void> {
    try {
      await supabaseAdmin
        .from('indexer_state')
        .upsert({
          indexer_type: 'stealth_address',
          last_processed_version: version,
          updated_at: new Date().toISOString(),
        });

      this.lastProcessedVersion = version;
    } catch (error) {
      console.error('❌ Failed to save last processed version:', error);
    }
  }

  /**
   * Start polling for new transactions
   */
  private startPolling(): void {
    const poll = async () => {
      if (!this.isRunning) return;

      try {
        await this.processNewTransactions();
      } catch (error) {
        console.error('❌ Error processing transactions:', error);
      }

      // Schedule next poll
      setTimeout(poll, this.POLL_INTERVAL);
    };

    // Start polling
    poll();
  }

  /**
   * Process new transactions since last processed version
   */
  private async processNewTransactions(): Promise<void> {
    try {
      const ledgerInfo = await this.aptos.getLedgerInfo();
      const currentVersion = parseInt(ledgerInfo.ledger_version);

      if (currentVersion <= this.lastProcessedVersion) {
        return; // No new transactions
      }

      console.log(`📊 Processing transactions from ${this.lastProcessedVersion + 1} to ${currentVersion}`);

      // Process transactions in batches
      let startVersion = this.lastProcessedVersion + 1;
      let endVersion = Math.min(startVersion + this.BATCH_SIZE - 1, currentVersion);

      while (startVersion <= currentVersion) {
        await this.processTransactionBatch(startVersion, endVersion);
        startVersion = endVersion + 1;
        endVersion = Math.min(startVersion + this.BATCH_SIZE - 1, currentVersion);
      }

      // Update last processed version
      await this.saveLastProcessedVersion(currentVersion);

    } catch (error) {
      console.error('❌ Error processing new transactions:', error);
    }
  }

  /**
   * Process a batch of transactions
   */
  private async processTransactionBatch(startVersion: number, endVersion: number): Promise<void> {
    try {
      // Get transactions in this range
      const transactions = await this.aptos.getTransactions({
        startVersion,
        limit: endVersion - startVersion + 1,
      });

      for (const tx of transactions) {
        await this.processTransaction(tx);
      }

    } catch (error) {
      console.error(`❌ Error processing batch ${startVersion}-${endVersion}:`, error);
    }
  }

  /**
   * Process a single transaction
   */
  private async processTransaction(transaction: any): Promise<void> {
    try {
      // Check if this is a stealth address related transaction
      if (!this.isStealthAddressTransaction(transaction)) {
        return;
      }

      // Extract stealth address events
      const events = this.extractStealthEvents(transaction);
      
      for (const event of events) {
        await this.processStealthEvent(event, transaction);
      }

    } catch (error) {
      console.error('❌ Error processing transaction:', error);
    }
  }

  /**
   * Check if transaction is related to stealth addresses
   */
  private isStealthAddressTransaction(transaction: any): boolean {
    // Check if transaction contains stealth address module calls
    if (transaction.payload?.type === 'entry_function_payload') {
      const functionName = transaction.payload.function;
      return functionName.includes('stealth_address');
    }

    // Check if transaction contains stealth address events
    if (transaction.events) {
      return transaction.events.some((event: any) => 
        event.type.includes('stealth_address')
      );
    }

    return false;
  }

  /**
   * Extract stealth address events from transaction
   */
  private extractStealthEvents(transaction: any): StealthEvent[] {
    const events: StealthEvent[] = [];

    if (!transaction.events) return events;

    for (const event of transaction.events) {
      if (event.type.includes('PaymentCreatedEvent')) {
        events.push({
          type: 'payment_created',
          paymentId: event.data.payment_id,
          stealthAddress: event.data.stealth_address,
          amount: event.data.amount,
          coinType: event.data.coin_type,
          timestamp: event.data.timestamp,
          txHash: transaction.hash,
        });
      } else if (event.type.includes('PaymentClaimedEvent')) {
        events.push({
          type: 'payment_claimed',
          paymentId: event.data.payment_id,
          stealthAddress: event.data.stealth_address,
          claimedBy: event.data.claimed_by,
          timestamp: event.data.timestamp,
          txHash: transaction.hash,
        });
      }
    }

    return events;
  }

  /**
   * Process a stealth address event
   */
  private async processStealthEvent(event: StealthEvent, transaction: any): Promise<void> {
    try {
      if (event.type === 'payment_created') {
        await this.handlePaymentCreated(event, transaction);
      } else if (event.type === 'payment_claimed') {
        await this.handlePaymentClaimed(event, transaction);
      }
    } catch (error) {
      console.error('❌ Error processing stealth event:', error);
    }
  }

  /**
   * Handle payment created event
   */
  private async handlePaymentCreated(event: StealthEvent, transaction: any): Promise<void> {
    console.log(`💰 Stealth payment created: ${event.stealthAddress} - ${event.amount} ${event.coinType}`);

    // Store the stealth transaction in database
    const { error } = await supabaseAdmin
      .from('stealth_transactions')
      .insert({
        payment_id: event.paymentId,
        stealth_address: event.stealthAddress,
        amount: event.amount,
        coin_type: event.coinType,
        tx_hash: event.txHash,
        block_number: transaction.version,
        status: 'pending',
        created_at: new Date(event.timestamp * 1000).toISOString(),
      });

    if (error) {
      console.error('❌ Failed to store stealth transaction:', error);
    } else {
      console.log(`✅ Stored stealth transaction: ${event.paymentId}`);
    }
  }

  /**
   * Handle payment claimed event
   */
  private async handlePaymentClaimed(event: StealthEvent, transaction: any): Promise<void> {
    console.log(`🎉 Stealth payment claimed: ${event.stealthAddress} by ${event.claimedBy}`);

    // Update the stealth transaction status
    const { error } = await supabaseAdmin
      .from('stealth_transactions')
      .update({
        status: 'claimed',
        claimed_by: event.claimedBy,
        claimed_at: new Date(event.timestamp * 1000).toISOString(),
      })
      .eq('payment_id', event.paymentId);

    if (error) {
      console.error('❌ Failed to update stealth transaction:', error);
    } else {
      console.log(`✅ Updated stealth transaction: ${event.paymentId}`);
    }
  }

  /**
   * Get stealth transactions for a user
   */
  async getStealthTransactions(userId: string): Promise<StealthTransaction[]> {
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
      console.error('❌ Failed to get stealth transactions:', error);
      return [];
    }
  }

  /**
   * Get unclaimed stealth transactions for a user
   */
  async getUnclaimedTransactions(userId: string): Promise<StealthTransaction[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('stealth_transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to get unclaimed transactions:', error);
      return [];
    }
  }

  /**
   * Check if indexer is running
   */
  isIndexerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get indexer status
   */
  async getIndexerStatus(): Promise<{
    isRunning: boolean;
    lastProcessedVersion: number;
    currentLedgerVersion: number;
  }> {
    try {
      const ledgerInfo = await this.aptos.getLedgerInfo();
      const currentVersion = parseInt(ledgerInfo.ledger_version);

      return {
        isRunning: this.isRunning,
        lastProcessedVersion: this.lastProcessedVersion,
        currentLedgerVersion: currentVersion,
      };
    } catch (error) {
      console.error('❌ Failed to get indexer status:', error);
      return {
        isRunning: false,
        lastProcessedVersion: 0,
        currentLedgerVersion: 0,
      };
    }
  }
}

// Export singleton instance
export const stealthIndexer = new StealthIndexerService();
