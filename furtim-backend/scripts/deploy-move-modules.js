#!/usr/bin/env node

/**
 * Deploy Furtim Move modules to Aptos Testnet
 * This script deploys the stealth address functionality to the blockchain
 */

const { Aptos, Network, Account, Ed25519PrivateKey } = require('@aptos-labs/ts-sdk');
const fs = require('fs');
const path = require('path');

// Configuration
const NETWORK = Network.TESTNET;
const MODULE_NAME = 'furtim';
const MOVE_PACKAGE_PATH = path.join(__dirname, '../move');

// Initialize Aptos client
const aptos = new Aptos({
  network: NETWORK,
});

/**
 * Deploy the stealth address module to Aptos testnet
 */
async function deployStealthAddressModule() {
  try {
    console.log('🚀 Starting Furtim Move module deployment to Aptos Testnet...');
    
    // Check if we have a deployment account
    const deploymentAccount = await getOrCreateDeploymentAccount();
    console.log(`📋 Using deployment account: ${deploymentAccount.accountAddress}`);
    
    // Check account balance
    const balance = await aptos.getAccountAPTAmount({
      accountAddress: deploymentAccount.accountAddress,
    });
    console.log(`💰 Account balance: ${balance / 1e8} APT`);
    
    if (balance < 100000000) { // 0.1 APT minimum
      console.log('⚠️  Insufficient balance. Please fund the deployment account.');
      console.log(`   Send APT to: ${deploymentAccount.accountAddress}`);
      return;
    }
    
    // Deploy the module
    console.log('📦 Deploying stealth address module...');
    
    const publishResponse = await aptos.publishPackage({
      account: deploymentAccount,
      packageMetadata: {
        name: MODULE_NAME,
        version: '0.0.1',
        description: 'Furtim Stealth Address Payment System',
        authors: ['Furtim Team'],
        license: 'MIT',
      },
      modules: [
        fs.readFileSync(path.join(MOVE_PACKAGE_PATH, 'StealthAddress.move')),
      ],
    });
    
    console.log('✅ Module deployed successfully!');
    console.log(`📄 Transaction hash: ${publishResponse.hash}`);
    console.log(`🔗 View on explorer: https://explorer.aptoslabs.com/txn/${publishResponse.hash}?network=testnet`);
    
    // Initialize the module
    console.log('🔧 Initializing stealth address registry...');
    
    const initResponse = await aptos.runTransaction({
      account: deploymentAccount,
      payload: {
        type: 'entry_function_payload',
        function: `${deploymentAccount.accountAddress}::stealth_address::initialize`,
        arguments: [],
      },
    });
    
    console.log('✅ Stealth address registry initialized!');
    console.log(`📄 Initialization transaction: ${initResponse.hash}`);
    
    // Save deployment info
    const deploymentInfo = {
      network: NETWORK,
      moduleAddress: deploymentAccount.accountAddress,
      deploymentTx: publishResponse.hash,
      initTx: initResponse.hash,
      timestamp: new Date().toISOString(),
    };
    
    fs.writeFileSync(
      path.join(__dirname, '../deployment-info.json'),
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log('📋 Deployment info saved to deployment-info.json');
    console.log('🎉 Furtim stealth address system is now live on Aptos Testnet!');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

/**
 * Get or create deployment account
 */
async function getOrCreateDeploymentAccount() {
  const keyPath = path.join(__dirname, '../deployment-key.json');
  
  if (fs.existsSync(keyPath)) {
    // Load existing account
    const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    const privateKey = new Ed25519PrivateKey(keyData.privateKey);
    return Account.fromPrivateKey({ privateKey });
  } else {
    // Create new account
    console.log('🔑 Creating new deployment account...');
    const account = Account.generate();
    
    // Save account for future use
    const keyData = {
      privateKey: account.privateKey.toString(),
      publicKey: account.publicKey.toString(),
      accountAddress: account.accountAddress.toString(),
    };
    
    fs.writeFileSync(keyPath, JSON.stringify(keyData, null, 2));
    console.log(`💾 Account saved to ${keyPath}`);
    console.log(`🔑 Account address: ${account.accountAddress}`);
    console.log(`⚠️  IMPORTANT: Fund this account with APT for deployment!`);
    
    return account;
  }
}

/**
 * Verify deployment
 */
async function verifyDeployment(moduleAddress) {
  try {
    console.log('🔍 Verifying deployment...');
    
    // Check if module exists
    const module = await aptos.getAccountModule({
      accountAddress: moduleAddress,
      moduleName: 'stealth_address',
    });
    
    if (module) {
      console.log('✅ Stealth address module is deployed and accessible');
      return true;
    } else {
      console.log('❌ Module not found');
      return false;
    }
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return false;
  }
}

// Main execution
if (require.main === module) {
  deployStealthAddressModule()
    .then(() => {
      console.log('🎉 Deployment completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Deployment failed:', error);
      process.exit(1);
    });
}

module.exports = {
  deployStealthAddressModule,
  verifyDeployment,
};
