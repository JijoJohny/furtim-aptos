# Core Furtim Stealth Address Contract Testing
# Tests essential functionality on deployed devnet contracts

Write-Host "🎯 Core Furtim Stealth Address Testing" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Configuration
$DEPLOYED_ADDRESS = "0x25d93ca111e3b87e56c5f404073f7f74042e7fce04531fb97a6e597bb57b80bc"
$PROFILE = "devnet"
$MODULE_NAME = "furtim::stealth_address"

Write-Host "Deployed Address: $DEPLOYED_ADDRESS" -ForegroundColor White
Write-Host "Profile: $PROFILE" -ForegroundColor White

# Test 1: Verify Deployment
Write-Host "`n📋 Test 1: Verifying contract deployment..." -ForegroundColor Blue
$modules = aptos account list --profile $PROFILE --query modules
if ($modules -match $DEPLOYED_ADDRESS) {
    Write-Host "✅ Contract deployed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Contract deployment verification failed" -ForegroundColor Red
    exit 1
}

# Test 2: Initialize Registry
Write-Host "`n📋 Test 2: Initializing stealth address registry..." -ForegroundColor Blue
$initResult = aptos move run --profile $PROFILE --function-id "$DEPLOYED_ADDRESS::$MODULE_NAME::initialize"
if ($initResult -match "success|Executed successfully") {
    Write-Host "✅ Registry initialized successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Registry initialization failed" -ForegroundColor Red
    Write-Host "Result: $initResult" -ForegroundColor Yellow
}

# Test 3: Register Stealth Address
Write-Host "`n📋 Test 3: Registering stealth address..." -ForegroundColor Blue
$scanKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
$spendKey = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"

$registerResult = aptos move run --profile $PROFILE --function-id "$DEPLOYED_ADDRESS::$MODULE_NAME::register_stealth_address" --args hex:$scanKey hex:$spendKey
if ($registerResult -match "success|Executed successfully") {
    Write-Host "✅ Stealth address registered successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Stealth address registration failed" -ForegroundColor Red
    Write-Host "Result: $registerResult" -ForegroundColor Yellow
}

# Test 4: Check Registration
Write-Host "`n📋 Test 4: Checking stealth address info..." -ForegroundColor Blue
$infoResult = aptos move view --profile $PROFILE --function-id "$DEPLOYED_ADDRESS::$MODULE_NAME::get_stealth_address_info" --args address:$DEPLOYED_ADDRESS
Write-Host "Stealth Address Info: $infoResult" -ForegroundColor White

# Test 5: Check Active Status
Write-Host "`n📋 Test 5: Checking active status..." -ForegroundColor Blue
$activeResult = aptos move view --profile $PROFILE --function-id "$DEPLOYED_ADDRESS::$MODULE_NAME::is_stealth_address_active" --args address:$DEPLOYED_ADDRESS
Write-Host "Active Status: $activeResult" -ForegroundColor White

# Test 6: Create Test Payment
Write-Host "`n📋 Test 6: Creating test stealth payment..." -ForegroundColor Blue
$amount = "1000000"  # 0.001 APT
$ephemeralKey = "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba"

$paymentResult = aptos move run --profile $PROFILE --function-id "$DEPLOYED_ADDRESS::$MODULE_NAME::create_stealth_payment" --args hex:$ephemeralKey u64:$amount
if ($paymentResult -match "success|Executed successfully") {
    Write-Host "✅ Test payment created successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Test payment creation failed" -ForegroundColor Red
    Write-Host "Result: $paymentResult" -ForegroundColor Yellow
}

# Test 7: Check Payment Info
Write-Host "`n📋 Test 7: Checking payment info..." -ForegroundColor Blue
$paymentInfo = aptos move view --profile $PROFILE --function-id "$DEPLOYED_ADDRESS::$MODULE_NAME::get_stealth_payment_info" --args hex:$ephemeralKey
Write-Host "Payment Info: $paymentInfo" -ForegroundColor White

# Test 8: Check Payment Status
Write-Host "`n📋 Test 8: Checking payment status..." -ForegroundColor Blue
$paymentStatus = aptos move view --profile $PROFILE --function-id "$DEPLOYED_ADDRESS::$MODULE_NAME::is_payment_claimed" --args hex:$ephemeralKey
Write-Host "Payment Status: $paymentStatus" -ForegroundColor White

# Final Results
Write-Host "`n📊 CORE TESTING COMPLETED" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host "Contract Address: $DEPLOYED_ADDRESS" -ForegroundColor White
Write-Host "Network: Devnet" -ForegroundColor White
Write-Host "Profile: $PROFILE" -ForegroundColor White

Write-Host "`n🔗 View on Explorer:" -ForegroundColor Cyan
Write-Host "https://explorer.aptoslabs.com/account/$DEPLOYED_ADDRESS?network=devnet" -ForegroundColor Blue

Write-Host "`n✨ Core testing completed! Check results above." -ForegroundColor Green
