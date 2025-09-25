# Comprehensive Testnet Testing Script for Furtim Stealth Address Contracts
# Tests the deployed contract on Aptos Testnet

Write-Host "=== FURTIM TESTNET CONTRACT TESTING ===" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Cyan

# Configuration from deployment-testnet-external.json
$DEPLOYED_ADDRESS = "0x2e04b9fdd49ae932c8b08f04540363233093fec62579139722eb4b6a9f33464c"
$PROFILE = "testnet"
$MODULE_NAME = "stealth_address"
$NETWORK = "testnet"

# Test counters
$testsRun = 0
$testsPassed = 0
$testsFailed = 0

Write-Host "Deployed Address: $DEPLOYED_ADDRESS" -ForegroundColor White
Write-Host "Profile: $PROFILE" -ForegroundColor White
Write-Host "Network: $NETWORK" -ForegroundColor White
Write-Host ""

# Function to run a test and track results
function Test-ContractFunction {
    param(
        [string]$TestName,
        [string]$Command,
        [string]$ExpectedResult = "success"
    )
    
    Write-Host "Test $($testsRun + 1): $TestName" -ForegroundColor Blue
    Write-Host "Command: $Command" -ForegroundColor Gray
    
    try {
        $result = Invoke-Expression $Command
        $testsRun++
        
        if ($result -match "success|Executed successfully|Result.*Success") {
            Write-Host "PASS: $TestName" -ForegroundColor Green
            $script:testsPassed++
        } elseif ($result -match "E_REGISTRY_ALREADY_EXISTS|already exists") {
            Write-Host "PASS: $TestName (expected behavior)" -ForegroundColor Green
            $script:testsPassed++
        } else {
            Write-Host "FAIL: $TestName" -ForegroundColor Red
            Write-Host "Result: $result" -ForegroundColor Yellow
            $script:testsFailed++
        }
    }
    catch {
        Write-Host "ERROR: $TestName" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
        $script:testsRun++
        $script:testsFailed++
    }
}

# Function to check account balance
function Check-AccountBalance {
    Write-Host "Checking account balance..." -ForegroundColor Cyan
    try {
        $balance = aptos account balance --profile $PROFILE
        Write-Host "Account Balance: $balance" -ForegroundColor White
    }
    catch {
        Write-Host "Could not retrieve balance: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Start testing
Write-Host "Starting comprehensive testnet contract testing..." -ForegroundColor Green

# Check initial account state
Check-AccountBalance

# Test 1: Verify Contract Deployment
Test-ContractFunction -TestName "Contract Deployment Verification" -Command "aptos account list --profile $PROFILE --query modules"

# Test 2: Check Contract Resources
Test-ContractFunction -TestName "Contract Resources Check" -Command "aptos account list --profile $PROFILE --query resources"

# Test 3: Initialize Stealth Address Registry (should fail if already exists)
Test-ContractFunction -TestName "Initialize Stealth Address Registry" -Command "aptos move run --profile $PROFILE --function-id `"$DEPLOYED_ADDRESS::$MODULE_NAME::initialize`" --assume-yes"

# Test 4: Register Stealth Address
$testScanKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
$testSpendKey = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"

Test-ContractFunction -TestName "Register Stealth Address" -Command "aptos move run --profile $PROFILE --function-id `"$DEPLOYED_ADDRESS::$MODULE_NAME::register_stealth_address`" --args hex:$testScanKey hex:$testSpendKey --assume-yes"

# Test 5: Get Recipient Public Keys
Test-ContractFunction -TestName "Get Recipient Public Keys" -Command "aptos move view --profile $PROFILE --function-id `"$DEPLOYED_ADDRESS::$MODULE_NAME::get_recipient_public_keys`" --args address:$DEPLOYED_ADDRESS"

# Test 6: Get Stealth Address Info
Test-ContractFunction -TestName "Get Stealth Address Info" -Command "aptos move view --profile $PROFILE --function-id `"$DEPLOYED_ADDRESS::$MODULE_NAME::get_stealth_address_info`" --args address:$DEPLOYED_ADDRESS"

# Test 7: Create Stealth Payment
$testAmount = 1000000  # 0.001 APT in octas
$testEphemeralKey = "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba"
$testDescription = "Test payment on testnet"
$testSignature = "0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff"

Test-ContractFunction -TestName "Create Stealth Payment" -Command "aptos move run --profile $PROFILE --function-id `"$DEPLOYED_ADDRESS::$MODULE_NAME::create_stealth_payment`" --args address:$DEPLOYED_ADDRESS hex:$testEphemeralKey u64:$testAmount string:$testDescription hex:$testSignature --assume-yes"

# Test 8: Claim Stealth Payment
Test-ContractFunction -TestName "Claim Stealth Payment" -Command "aptos move run --profile $PROFILE --function-id `"$DEPLOYED_ADDRESS::$MODULE_NAME::claim_stealth_payment`" --args address:$DEPLOYED_ADDRESS u64:$testAmount hex:$testEphemeralKey hex:$testSignature --assume-yes"

# Test 9: Deactivate Stealth Address
Test-ContractFunction -TestName "Deactivate Stealth Address" -Command "aptos move run --profile $PROFILE --function-id `"$DEPLOYED_ADDRESS::$MODULE_NAME::deactivate_stealth_address`" --assume-yes"

# Test 10: Reactivate Stealth Address
Test-ContractFunction -TestName "Reactivate Stealth Address" -Command "aptos move run --profile $PROFILE --function-id `"$DEPLOYED_ADDRESS::$MODULE_NAME::reactivate_stealth_address`" --args hex:$testScanKey hex:$testSpendKey --assume-yes"

# Test 11: Create Another Payment After Reactivation
$testAmount2 = 2000000  # 0.002 APT
$testEphemeralKey2 = "0x555566667777888899990000aaaabbbbccccddddeeeeffff1111222233334444"

Test-ContractFunction -TestName "Create Second Stealth Payment" -Command "aptos move run --profile $PROFILE --function-id `"$DEPLOYED_ADDRESS::$MODULE_NAME::create_stealth_payment`" --args address:$DEPLOYED_ADDRESS hex:$testEphemeralKey2 u64:$testAmount2 string:`"Second test payment`" hex:$testSignature --assume-yes"

# Test 12: Claim Second Payment
Test-ContractFunction -TestName "Claim Second Stealth Payment" -Command "aptos move run --profile $PROFILE --function-id `"$DEPLOYED_ADDRESS::$MODULE_NAME::claim_stealth_payment`" --args address:$DEPLOYED_ADDRESS u64:$testAmount2 hex:$testEphemeralKey2 hex:$testSignature --assume-yes"

# Final balance check
Check-AccountBalance

# Test Summary
Write-Host ""
Write-Host "=== COMPREHENSIVE TESTNET TEST RESULTS ===" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Total Tests Run: $testsRun" -ForegroundColor White
Write-Host "Tests Passed: $testsPassed" -ForegroundColor Green
Write-Host "Tests Failed: $testsFailed" -ForegroundColor Red

if ($testsFailed -eq 0) {
    Write-Host ""
    Write-Host "ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "Your Furtim stealth address contracts are working perfectly on Testnet!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Some tests failed. Check the output above for details." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Contract Details:" -ForegroundColor Cyan
Write-Host "- Address: $DEPLOYED_ADDRESS" -ForegroundColor White
Write-Host "- Network: $NETWORK" -ForegroundColor White
Write-Host "- Module: $MODULE_NAME" -ForegroundColor White

Write-Host ""
Write-Host "Explorer Links:" -ForegroundColor Cyan
Write-Host "- Account: https://explorer.aptoslabs.com/account/$DEPLOYED_ADDRESS?network=$NETWORK" -ForegroundColor Blue
Write-Host "- Testnet Explorer: https://explorer.aptoslabs.com/?network=$NETWORK" -ForegroundColor Blue

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Review any failed tests above" -ForegroundColor White
Write-Host "2. Test with frontend integration" -ForegroundColor White
Write-Host "3. Deploy to mainnet for production" -ForegroundColor White
Write-Host "4. Monitor contract performance" -ForegroundColor White

Write-Host ""
Write-Host "Testing completed!" -ForegroundColor Green
