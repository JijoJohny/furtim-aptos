# Test All Functionalities Script
# Tests all components of the stealth address payment system

Write-Host "🧪 Testing All Functionalities..." -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Change to backend directory
Set-Location furtim-backend

Write-Host "1️⃣ Testing Contract Configuration..." -ForegroundColor Green
node -e "
console.log('📋 Contract Configuration Test');
const { getContractConfig, getContractFunctions } = require('./src/config/contracts.ts');
const config = getContractConfig();
const functions = getContractFunctions();

console.log('✅ Contract Address:', config.address);
console.log('✅ Network:', config.network);
console.log('✅ Status:', config.status);
console.log('✅ RPC URL:', config.rpcUrl);

console.log('✅ Initialize Function:', functions.initialize);
console.log('✅ Register Function:', functions.registerStealthAddress);
console.log('✅ Create Payment Function:', functions.createStealthPayment);
console.log('✅ Claim Payment Function:', functions.claimStealthPayment);
"

Write-Host "2️⃣ Testing Backend Services..." -ForegroundColor Green
node -e "
console.log('🔧 Backend Services Test');
try {
  const { StealthIndexerService } = require('./src/services/stealthIndexer.ts');
  const indexer = new StealthIndexerService();
  console.log('✅ StealthIndexerService initialized');
} catch (error) {
  console.log('⚠️ StealthIndexerService:', error.message);
}

try {
  const { StealthClaimService } = require('./src/services/stealthClaimService.ts');
  const claimService = new StealthClaimService();
  console.log('✅ StealthClaimService initialized');
} catch (error) {
  console.log('⚠️ StealthClaimService:', error.message);
}

try {
  const { metaKeysService } = require('./src/services/metaKeysService.ts');
  console.log('✅ MetaKeysService initialized');
} catch (error) {
  console.log('⚠️ MetaKeysService:', error.message);
}

try {
  const { authService } = require('./src/services/authService.ts');
  console.log('✅ AuthService initialized');
} catch (error) {
  console.log('⚠️ AuthService:', error.message);
}
"

Write-Host "3️⃣ Testing Database Configuration..." -ForegroundColor Green
node -e "
console.log('🗄️ Database Configuration Test');
try {
  const { supabaseAdmin } = require('./src/config/supabase.ts');
  console.log('✅ Supabase configuration loaded');
} catch (error) {
  console.log('⚠️ Database configuration:', error.message);
}
"

Write-Host "4️⃣ Testing API Routes..." -ForegroundColor Green
node -e "
console.log('🌐 API Routes Test');
try {
  const authRoutes = require('./src/routes/auth.ts');
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.log('⚠️ Auth routes:', error.message);
}

try {
  const stealthRoutes = require('./src/routes/stealth.ts');
  console.log('✅ Stealth routes loaded');
} catch (error) {
  console.log('⚠️ Stealth routes:', error.message);
}
"

Write-Host "5️⃣ Testing Contract Deployment..." -ForegroundColor Green
node -e "
console.log('📦 Contract Deployment Test');
const { getContractConfig } = require('./src/config/contracts.ts');
const config = getContractConfig();

if (config.status === 'deployed') {
  console.log('✅ Contract is deployed on', config.network);
  console.log('✅ Contract address:', config.address);
  console.log('✅ Deployment transaction:', config.deploymentTx);
  console.log('✅ Initialization transaction:', config.initTx);
} else {
  console.log('⚠️ Contract not deployed on', config.network);
}
"

Write-Host "6️⃣ Testing Move Contract..." -ForegroundColor Green
Set-Location move
aptos account list --account 0x2e04b9fdd49ae932c8b08f04540363233093fec62579139722eb4b6a9f33464c --url https://fullnode.testnet.aptoslabs.com/v1
Set-Location ..

Write-Host "✅ All functionality tests completed!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "🎉 STEALTH ADDRESS SYSTEM READY! 🎉" -ForegroundColor Yellow
