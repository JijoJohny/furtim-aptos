# Quick Testnet Testing Script for Furtim Stealth Address Contracts
# Basic verification of deployed testnet contract

Write-Host "=== FURTIM TESTNET QUICK TESTING ===" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan

# Configuration from deployment-testnet-external.json
$DEPLOYED_ADDRESS = "0x2e04b9fdd49ae932c8b08f04540363233093fec62579139722eb4b6a9f33464c"
$PROFILE = "testnet"
$MODULE_NAME = "stealth_address"
$NETWORK = "testnet"

Write-Host "Deployed Address: $DEPLOYED_ADDRESS" -ForegroundColor White
Write-Host "Profile: $PROFILE" -ForegroundColor White
Write-Host "Network: $NETWORK" -ForegroundColor White
Write-Host ""

# Test 1: Verify Contract Deployment
Write-Host "Test 1: Verifying contract deployment..." -ForegroundColor Blue
$modules = aptos account list --profile $PROFILE --query modules
if ($modules -match $DEPLOYED_ADDRESS) {
    Write-Host "PASS: Contract deployed successfully" -ForegroundColor Green
} else {
    Write-Host "FAIL: Contract deployment verification failed" -ForegroundColor Red
    Write-Host "Modules: $modules" -ForegroundColor Yellow
}

# Test 2: Check Registry Initialization
Write-Host "`nTest 2: Checking registry initialization..." -ForegroundColor Blue
$initResult = aptos move run --profile $PROFILE --function-id "$DEPLOYED_ADDRESS::$MODULE_NAME::initialize" --assume-yes
if ($initResult -match "E_REGISTRY_ALREADY_EXISTS") {
    Write-Host "PASS: Registry already exists (expected)" -ForegroundColor Green
} else {
    Write-Host "FAIL: Unexpected result: $initResult" -ForegroundColor Red
}

# Test 3: Register Stealth Address
Write-Host "`nTest 3: Registering stealth address..." -ForegroundColor Blue
$scanKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
$spendKey = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"

$registerResult = aptos move run --profile $PROFILE --function-id "$DEPLOYED_ADDRESS::$MODULE_NAME::register_stealth_address" --args hex:$scanKey hex:$spendKey --assume-yes
if ($registerResult -match "success|Executed successfully") {
    Write-Host "PASS: Stealth address registered successfully" -ForegroundColor Green
} else {
    Write-Host "FAIL: Registration failed: $registerResult" -ForegroundColor Red
}

# Test 4: Create Test Payment
Write-Host "`nTest 4: Creating test stealth payment..." -ForegroundColor Blue
$amount = 1000000  # 0.001 APT
$ephemeralKey = "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba"
$description = "Test payment on testnet"
$signature = "0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff"

$paymentResult = aptos move run --profile $PROFILE --function-id "$DEPLOYED_ADDRESS::$MODULE_NAME::create_stealth_payment" --args address:$DEPLOYED_ADDRESS hex:$ephemeralKey u64:$amount string:$description hex:$signature --assume-yes
if ($paymentResult -match "success|Executed successfully") {
    Write-Host "PASS: Test payment created successfully" -ForegroundColor Green
} else {
    Write-Host "FAIL: Payment creation failed: $paymentResult" -ForegroundColor Red
}

# Test 5: Claim Test Payment
Write-Host "`nTest 5: Claiming test payment..." -ForegroundColor Blue
$claimResult = aptos move run --profile $PROFILE --function-id "$DEPLOYED_ADDRESS::$MODULE_NAME::claim_stealth_payment" --args address:$DEPLOYED_ADDRESS u64:$amount hex:$ephemeralKey hex:$signature --assume-yes
if ($claimResult -match "success|Executed successfully") {
    Write-Host "PASS: Test payment claimed successfully" -ForegroundColor Green
} else {
    Write-Host "FAIL: Payment claiming failed: $claimResult" -ForegroundColor Red
}

# Test 6: Test Deactivation/Reactivation
Write-Host "`nTest 6: Testing deactivation/reactivation..." -ForegroundColor Blue
$deactivateResult = aptos move run --profile $PROFILE --function-id "$DEPLOYED_ADDRESS::$MODULE_NAME::deactivate_stealth_address" --assume-yes
if ($deactivateResult -match "success|Executed successfully") {
    Write-Host "PASS: Stealth address deactivated successfully" -ForegroundColor Green
    
    $reactivateResult = aptos move run --profile $PROFILE --function-id "$DEPLOYED_ADDRESS::$MODULE_NAME::reactivate_stealth_address" --args hex:$scanKey hex:$spendKey --assume-yes
    if ($reactivateResult -match "success|Executed successfully") {
        Write-Host "PASS: Stealth address reactivated successfully" -ForegroundColor Green
    } else {
        Write-Host "FAIL: Reactivation failed: $reactivateResult" -ForegroundColor Red
    }
} else {
    Write-Host "FAIL: Deactivation failed: $deactivateResult" -ForegroundColor Red
}

# Final Results
Write-Host ""
Write-Host "=== QUICK TESTNET TEST RESULTS ===" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green
Write-Host "Contract Address: $DEPLOYED_ADDRESS" -ForegroundColor White
Write-Host "Network: $NETWORK" -ForegroundColor White
Write-Host "Profile: $PROFILE" -ForegroundColor White

Write-Host ""
Write-Host "Explorer Links:" -ForegroundColor Cyan
Write-Host "- Account: https://explorer.aptoslabs.com/account/$DEPLOYED_ADDRESS?network=$NETWORK" -ForegroundColor Blue
Write-Host "- Testnet Explorer: https://explorer.aptoslabs.com/?network=$NETWORK" -ForegroundColor Blue

Write-Host ""
Write-Host "Quick testing completed! Check results above." -ForegroundColor Green
