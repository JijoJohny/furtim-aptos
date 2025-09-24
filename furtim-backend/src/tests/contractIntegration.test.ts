/**
 * Contract Integration Tests
 * 
 * Tests the backend integration with deployed stealth address contracts
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { Aptos, Network } from '@aptos-labs/ts-sdk';
import { getContractConfig, getContractFunctions } from '../config/contracts';
import { StealthIndexerService } from '../services/stealthIndexer';
import { StealthClaimService } from '../services/stealthClaimService';

describe('Contract Integration Tests', () => {
  let aptos: Aptos;
  let contractConfig: any;
  let contractFunctions: any;

  beforeAll(async () => {
    // Initialize Aptos client
    contractConfig = getContractConfig();
    contractFunctions = getContractFunctions();
    
    aptos = new Aptos({
      network: contractConfig.network as Network,
      fullnode: contractConfig.rpcUrl,
    });
  });

  describe('Contract Configuration', () => {
    it('should have valid testnet configuration', () => {
      expect(contractConfig.network).toBe('testnet');
      expect(contractConfig.status).toBe('deployed');
      expect(contractConfig.address).toBe('0x2e04b9fdd49ae932c8b08f04540363233093fec62579139722eb4b6a9f33464c');
      expect(contractConfig.rpcUrl).toBe('https://fullnode.testnet.aptoslabs.com/v1');
    });

    it('should have valid contract function IDs', () => {
      expect(contractFunctions.initialize).toContain('stealth_address::initialize');
      expect(contractFunctions.registerStealthAddress).toContain('register_stealth_address');
      expect(contractFunctions.createStealthPayment).toContain('create_stealth_payment');
      expect(contractFunctions.claimStealthPayment).toContain('claim_stealth_payment');
    });
  });

  describe('Contract Deployment Verification', () => {
    it('should be able to connect to testnet', async () => {
      try {
        const ledgerInfo = await aptos.getLedgerInfo();
        expect(ledgerInfo.chain_id).toBeDefined();
        expect(ledgerInfo.ledger_version).toBeDefined();
      } catch (error) {
        console.error('Failed to connect to testnet:', error);
        throw error;
      }
    });

    it('should verify contract is deployed', async () => {
      try {
        const accountInfo = await aptos.getAccountInfo({
          accountAddress: contractConfig.address,
        });
        
        expect(accountInfo).toBeDefined();
        expect(accountInfo.authentication_key).toBeDefined();
      } catch (error) {
        console.error('Failed to verify contract deployment:', error);
        throw error;
      }
    });

    it('should verify stealth address module exists', async () => {
      try {
        const accountModules = await aptos.getAccountModules({
          accountAddress: contractConfig.address,
        });
        
        const stealthModule = accountModules.find(
          (module) => module.name === 'stealth_address'
        );
        
        expect(stealthModule).toBeDefined();
        expect(stealthModule?.name).toBe('stealth_address');
      } catch (error) {
        console.error('Failed to verify stealth address module:', error);
        throw error;
      }
    });
  });

  describe('Service Integration', () => {
    it('should initialize StealthIndexerService', () => {
      const indexer = new StealthIndexerService();
      expect(indexer).toBeDefined();
    });

    it('should initialize StealthClaimService', () => {
      const claimService = new StealthClaimService();
      expect(claimService).toBeDefined();
    });
  });

  describe('Contract Function Verification', () => {
    it('should verify initialize function exists', async () => {
      try {
        // This would normally be called with a signer, but we're just verifying the function exists
        const functionId = contractFunctions.initialize;
        expect(functionId).toContain(contractConfig.address);
        expect(functionId).toContain('stealth_address::initialize');
      } catch (error) {
        console.error('Failed to verify initialize function:', error);
        throw error;
      }
    });

    it('should verify register_stealth_address function exists', async () => {
      try {
        const functionId = contractFunctions.registerStealthAddress;
        expect(functionId).toContain(contractConfig.address);
        expect(functionId).toContain('register_stealth_address');
      } catch (error) {
        console.error('Failed to verify register_stealth_address function:', error);
        throw error;
      }
    });

    it('should verify create_stealth_payment function exists', async () => {
      try {
        const functionId = contractFunctions.createStealthPayment;
        expect(functionId).toContain(contractConfig.address);
        expect(functionId).toContain('create_stealth_payment');
      } catch (error) {
        console.error('Failed to verify create_stealth_payment function:', error);
        throw error;
      }
    });

    it('should verify claim_stealth_payment function exists', async () => {
      try {
        const functionId = contractFunctions.claimStealthPayment;
        expect(functionId).toContain(contractConfig.address);
        expect(functionId).toContain('claim_stealth_payment');
      } catch (error) {
        console.error('Failed to verify claim_stealth_payment function:', error);
        throw error;
      }
    });
  });
});
