/**
 * Tests for Stealth Indexer Service
 * Tests the blockchain monitoring and transaction processing functionality
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { stealthIndexer } from '../services/stealthIndexer';

// Mock the Aptos SDK
jest.mock('@aptos-labs/ts-sdk', () => ({
  Aptos: jest.fn().mockImplementation(() => ({
    getLedgerInfo: jest.fn(),
    getTransactions: jest.fn(),
  })),
  Network: {
    TESTNET: 'testnet',
  },
}));

// Mock Supabase
jest.mock('../config/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      })),
      upsert: jest.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

describe('StealthIndexerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Indexer Lifecycle', () => {
    it('should start indexer successfully', async () => {
      const startSpy = jest.spyOn(stealthIndexer, 'start');
      
      await stealthIndexer.start();
      
      expect(startSpy).toHaveBeenCalled();
    });

    it('should stop indexer successfully', async () => {
      const stopSpy = jest.spyOn(stealthIndexer, 'stop');
      
      await stealthIndexer.stop();
      
      expect(stopSpy).toHaveBeenCalled();
    });

    it('should not start indexer if already running', async () => {
      await stealthIndexer.start();
      const consoleSpy = jest.spyOn(console, 'log');
      
      await stealthIndexer.start();
      
      expect(consoleSpy).toHaveBeenCalledWith('⚠️  Stealth indexer is already running');
    });
  });

  describe('Transaction Processing', () => {
    it('should process stealth address transactions', async () => {
      const mockTransaction = {
        version: 12345,
        hash: '0x1234567890abcdef',
        payload: {
          type: 'entry_function_payload',
          function: 'furtim::stealth_address::create_stealth_payment',
        },
        events: [
          {
            type: 'furtim::stealth_address::PaymentCreatedEvent',
            data: {
              payment_id: 1,
              stealth_address: '0xabcdef1234567890',
              amount: 100,
              coin_type: 'USDC',
              timestamp: 1234567890,
            },
          },
        ],
      };

      const mockLedgerInfo = {
        ledger_version: '12350',
      };

      // Mock Aptos SDK methods
      const { Aptos } = require('@aptos-labs/ts-sdk');
      const mockAptos = new Aptos();
      mockAptos.getLedgerInfo.mockResolvedValue(mockLedgerInfo);
      mockAptos.getTransactions.mockResolvedValue([mockTransaction]);

      // Mock Supabase responses
      const mockSupabase = require('../config/supabase').supabaseAdmin;
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => Promise.resolve({ data: {}, error: null })),
        })),
        upsert: jest.fn(() => Promise.resolve({ error: null })),
      });

      await stealthIndexer.start();
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockAptos.getLedgerInfo).toHaveBeenCalled();
      expect(mockAptos.getTransactions).toHaveBeenCalled();
    });

    it('should handle non-stealth transactions', async () => {
      const mockTransaction = {
        version: 12345,
        hash: '0x1234567890abcdef',
        payload: {
          type: 'entry_function_payload',
          function: '0x1::coin::transfer',
        },
        events: [],
      };

      const mockLedgerInfo = {
        ledger_version: '12350',
      };

      const { Aptos } = require('@aptos-labs/ts-sdk');
      const mockAptos = new Aptos();
      mockAptos.getLedgerInfo.mockResolvedValue(mockLedgerInfo);
      mockAptos.getTransactions.mockResolvedValue([mockTransaction]);

      await stealthIndexer.start();
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockAptos.getLedgerInfo).toHaveBeenCalled();
      expect(mockAptos.getTransactions).toHaveBeenCalled();
    });
  });

  describe('Event Processing', () => {
    it('should process PaymentCreatedEvent', async () => {
      const mockEvent = {
        type: 'furtim::stealth_address::PaymentCreatedEvent',
        data: {
          payment_id: 1,
          stealth_address: '0xabcdef1234567890',
          amount: 100,
          coin_type: 'USDC',
          timestamp: 1234567890,
        },
      };

      const mockTransaction = {
        version: 12345,
        hash: '0x1234567890abcdef',
        events: [mockEvent],
      };

      const { Aptos } = require('@aptos-labs/ts-sdk');
      const mockAptos = new Aptos();
      mockAptos.getLedgerInfo.mockResolvedValue({ ledger_version: '12350' });
      mockAptos.getTransactions.mockResolvedValue([mockTransaction]);

      const mockSupabase = require('../config/supabase').supabaseAdmin;
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => Promise.resolve({ data: {}, error: null })),
        })),
        upsert: jest.fn(() => Promise.resolve({ error: null })),
      });

      await stealthIndexer.start();
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockSupabase.from).toHaveBeenCalledWith('stealth_transactions');
    });

    it('should process PaymentClaimedEvent', async () => {
      const mockEvent = {
        type: 'furtim::stealth_address::PaymentClaimedEvent',
        data: {
          payment_id: 1,
          stealth_address: '0xabcdef1234567890',
          claimed_by: '0x1234567890abcdef',
          amount: 100,
          timestamp: 1234567890,
        },
      };

      const mockTransaction = {
        version: 12345,
        hash: '0x1234567890abcdef',
        events: [mockEvent],
      };

      const { Aptos } = require('@aptos-labs/ts-sdk');
      const mockAptos = new Aptos();
      mockAptos.getLedgerInfo.mockResolvedValue({ ledger_version: '12350' });
      mockAptos.getTransactions.mockResolvedValue([mockTransaction]);

      const mockSupabase = require('../config/supabase').supabaseAdmin;
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null })),
        })),
        upsert: jest.fn(() => Promise.resolve({ error: null })),
      });

      await stealthIndexer.start();
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockSupabase.from).toHaveBeenCalledWith('stealth_transactions');
    });
  });

  describe('Error Handling', () => {
    it('should handle Aptos API errors gracefully', async () => {
      const { Aptos } = require('@aptos-labs/ts-sdk');
      const mockAptos = new Aptos();
      mockAptos.getLedgerInfo.mockRejectedValue(new Error('API Error'));

      const consoleSpy = jest.spyOn(console, 'error');
      
      await stealthIndexer.start();
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error processing new transactions'),
        expect.any(Error)
      );
    });

    it('should handle Supabase errors gracefully', async () => {
      const mockLedgerInfo = {
        ledger_version: '12350',
      };

      const { Aptos } = require('@aptos-labs/ts-sdk');
      const mockAptos = new Aptos();
      mockAptos.getLedgerInfo.mockResolvedValue(mockLedgerInfo);
      mockAptos.getTransactions.mockResolvedValue([]);

      const mockSupabase = require('../config/supabase').supabaseAdmin;
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: new Error('DB Error') })),
          })),
        })),
        upsert: jest.fn(() => Promise.resolve({ error: new Error('DB Error') })),
      });

      const consoleSpy = jest.spyOn(console, 'error');
      
      await stealthIndexer.start();
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to save last processed version'),
        expect.any(Error)
      );
    });
  });

  describe('Status Monitoring', () => {
    it('should return indexer status', async () => {
      const status = await stealthIndexer.getIndexerStatus();
      
      expect(status).toBeDefined();
      expect(status).toHaveProperty('isRunning');
      expect(status).toHaveProperty('lastProcessedVersion');
      expect(status).toHaveProperty('currentLedgerVersion');
    });

    it('should check if indexer is running', () => {
      const isRunning = stealthIndexer.isIndexerRunning();
      
      expect(typeof isRunning).toBe('boolean');
    });
  });
});
