# Basic Test Script for Furtim Stealth Address Contracts

Write-Host "Basic Furtim Contract Testing" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green

$DEPLOYED_ADDRESS = "0x25d93ca111e3b87e56c5f404073f7f74042e7fce04531fb97a6e597bb57b80bc"
$PROFILE = "devnet"

Write-Host "Deployed Address: $DEPLOYED_ADDRESS" -ForegroundColor White
Write-Host "Profile: $PROFILE" -ForegroundColor White

# Test 1: Check if registry already exists
Write-Host "`nTest 1: Checking registry initialization..." -ForegroundColor Blue
$initResult = aptos move run --profile $PROFILE --function-id "$DEPLOYED_ADDRESS::stealth_address::initialize" --assume-yes
if ($initResult -match "E_REGISTRY_ALREADY_EXISTS") {
    Write-Host "PASS: Registry already exists (expected)" -ForegroundColor Green
} else {
    Write-Host "FAIL: Unexpected result: $initResult" -ForegroundColor Red
}

# Test 2: Register stealth address
Write-Host "`nTest 2: Registering stealth address..." -ForegroundColor Blue
$scanKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
$spendKey = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"

$registerResult = aptos move run --profile $PROFILE --function-id "$DEPLOYED_ADDRESS::stealth_address::register_stealth_address" --args hex:$scanKey hex:$spendKey --assume-yes
if ($registerResult -match "success|Executed successfully") {
    Write-Host "PASS: Stealth address registered successfully" -ForegroundColor Green
} else {
    Write-Host "FAIL: Registration failed: $registerResult" -ForegroundColor Red
}

# Test 3: Get recipient public keys
Write-Host "`nTest 3: Getting recipient public keys..." -ForegroundColor Blue
$keysResult = aptos move view --profile $PROFILE --function-id "$DEPLOYED_ADDRESS::stealth_address::get_recipient_public_keys" --args address:$DEPLOYED_ADDRESS
Write-Host "Public Keys: $keysResult" -ForegroundColor White

# Test 4: Create stealth payment
Write-Host "`nTest 4: Creating stealth payment..." -ForegroundColor Blue
$amount = 1000000
$ephemeralKey = "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba"
$description = "Test payment"
$signature = "0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff"

$paymentResult = aptos move run --profile $PROFILE --function-id "$DEPLOYED_ADDRESS::stealth_address::create_stealth_payment" --args address:$DEPLOYED_ADDRESS hex:$ephemeralKey u64:$amount string:$description hex:$signature --assume-yes
if ($paymentResult -match "success|Executed successfully") {
    Write-Host "PASS: Stealth payment created successfully" -ForegroundColor Green
} else {
    Write-Host "FAIL: Payment creation failed: $paymentResult" -ForegroundColor Red
}

# Test 5: Claim stealth payment
Write-Host "`nTest 5: Claiming stealth payment..." -ForegroundColor Blue
$claimResult = aptos move run --profile $PROFILE --function-id "$DEPLOYED_ADDRESS::stealth_address::claim_stealth_payment" --args address:$DEPLOYED_ADDRESS u64:$amount hex:$ephemeralKey hex:$signature --assume-yes
if ($claimResult -match "success|Executed successfully") {
    Write-Host "PASS: Stealth payment claimed successfully" -ForegroundColor Green
} else {
    Write-Host "FAIL: Payment claiming failed: $claimResult" -ForegroundColor Red
}

# Test 6: Deactivate stealth address
Write-Host "`nTest 6: Deactivating stealth address..." -ForegroundColor Blue
$deactivateResult = aptos move run --profile $PROFILE --function-id "$DEPLOYED_ADDRESS::stealth_address::deactivate_stealth_address" --assume-yes
if ($deactivateResult -match "success|Executed successfully") {
    Write-Host "PASS: Stealth address deactivated successfully" -ForegroundColor Green
} else {
    Write-Host "FAIL: Deactivation failed: $deactivateResult" -ForegroundColor Red
}

# Test 7: Reactivate stealth address
Write-Host "`nTest 7: Reactivating stealth address..." -ForegroundColor Blue
$reactivateResult = aptos move run --profile $PROFILE --function-id "$DEPLOYED_ADDRESS::stealth_address::reactivate_stealth_address" --args hex:$scanKey hex:$spendKey --assume-yes
if ($reactivateResult -match "success|Executed successfully") {
    Write-Host "PASS: Stealth address reactivated successfully" -ForegroundColor Green
} else {
    Write-Host "FAIL: Reactivation failed: $reactivateResult" -ForegroundColor Red
}

# Final Results
Write-Host "`nTESTING COMPLETED" -ForegroundColor Green
Write-Host "=================" -ForegroundColor Green
Write-Host "Contract Address: $DEPLOYED_ADDRESS" -ForegroundColor White
Write-Host "Network: Devnet" -ForegroundColor White

Write-Host "`nView on Explorer:" -ForegroundColor Cyan
Write-Host "https://explorer.aptoslabs.com/account/$DEPLOYED_ADDRESS?network=devnet" -ForegroundColor Blue

Write-Host "`nTesting completed! Check results above." -ForegroundColor Green

