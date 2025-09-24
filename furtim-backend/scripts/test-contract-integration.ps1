# Test Contract Integration Script
# Tests the backend integration with deployed stealth address contracts

Write-Host "🧪 Testing Contract Integration..." -ForegroundColor Cyan

# Change to backend directory
Set-Location furtim-backend

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Run contract integration tests
Write-Host "🔍 Running contract integration tests..." -ForegroundColor Green
npm test -- --testPathPattern=contractIntegration.test.ts

# Test contract configuration
Write-Host "⚙️ Testing contract configuration..." -ForegroundColor Green
node -e "
const { getContractConfig, getContractFunctions } = require('./src/config/contracts.ts');
const config = getContractConfig();
const functions = getContractFunctions();

console.log('📋 Contract Configuration:');
console.log('Network:', config.network);
console.log('Address:', config.address);
console.log('Status:', config.status);
console.log('RPC URL:', config.rpcUrl);

console.log('\n🔧 Contract Functions:');
console.log('Initialize:', functions.initialize);
console.log('Register:', functions.registerStealthAddress);
console.log('Create Payment:', functions.createStealthPayment);
console.log('Claim Payment:', functions.claimStealthPayment);
"

# Test Aptos connection
Write-Host "🌐 Testing Aptos connection..." -ForegroundColor Green
node -e "
const { Aptos, Network } = require('@aptos-labs/ts-sdk');
const { getContractConfig } = require('./src/config/contracts.ts');

async function testConnection() {
    try {
        const config = getContractConfig();
        const aptos = new Aptos({
            network: config.network,
            fullnode: config.rpcUrl,
        });
        
        const ledgerInfo = await aptos.getLedgerInfo();
        console.log('✅ Connected to Aptos network');
        console.log('Chain ID:', ledgerInfo.chain_id);
        console.log('Ledger Version:', ledgerInfo.ledger_version);
        
        // Test contract deployment
        const accountInfo = await aptos.getAccountInfo({
            accountAddress: config.address,
        });
        console.log('✅ Contract account verified');
        console.log('Account Address:', accountInfo.authentication_key);
        
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
    }
}

testConnection();
"

Write-Host "✅ Contract integration test completed!" -ForegroundColor Green
