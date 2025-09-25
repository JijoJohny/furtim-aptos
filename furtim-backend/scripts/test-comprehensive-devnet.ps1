# Comprehensive Furtim Stealth Address Contract Testing Script
# Tests all functionality of deployed contracts on Aptos Devnet

Write-Host "🧪 Comprehensive Furtim Stealth Address Contract Testing" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green

# Configuration
$DEPLOYED_ADDRESS = "0x25d93ca111e3b87e56c5f404073f7f74042e7fce04531fb97a6e597bb57b80bc"
$PROFILE = "devnet"
$MODULE_NAME = "furtim::stealth_address"

# Test counters
$testsRun = 0
$testsPassed = 0
$testsFailed = 0

# Function to run a test and track results
function Test-ContractFunction {
    param(
        [string]$TestName,
        [string]$Command,
        [string]$ExpectedResult = "success"
    )
    
    Write-Host "`n🔍 Test $($testsRun + 1): $TestName" -ForegroundColor Blue
    Write-Host "Command: $Command" -ForegroundColor Gray
    
    try {
        $result = Invoke-Expression $Command
        $testsRun++
        
        if ($result -match "success|Executed successfully|Result.*Success") {
            Write-Host "✅ PASSED: $TestName" -ForegroundColor Green
            $script:testsPassed++
        } else {
            Write-Host "❌ FAILED: $TestName" -ForegroundColor Red
            Write-Host "Result: $result" -ForegroundColor Yellow
            $script:testsFailed++
        }
    }
    catch {
        Write-Host "❌ ERROR: $TestName" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
        $script:testsRun++
        $script:testsFailed++
    }
}

# Function to check account balance
function Check-AccountBalance {
    Write-Host "`n💰 Checking account balance..." -ForegroundColor Cyan
    $balance = aptos account balance --profile $PROFILE
    Write-Host "Account Balance: $balance" -ForegroundColor White
}

# Function to wait for transaction confirmation
function Wait-ForTransaction {
    param([string]$TxHash)
    Write-Host "⏳ Waiting for transaction confirmation..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
}

# Start testing
Write-Host "`n📋 Starting comprehensive contract testing..." -ForegroundColor Green
Write-Host "Deployed Address: $DEPLOYED_ADDRESS" -ForegroundColor White
Write-Host "Profile: $PROFILE" -ForegroundColor White

# Check initial account state
Check-AccountBalance

# Test 1: Verify Contract Deployment
Test-ContractFunction -TestName "Contract Deployment Verification" -Command "aptos account list --profile $PROFILE --query modules"

# Test 2: Check Contract Resources
Test-ContractFunction -TestName "Contract Resources Check" -Command "aptos account list --profile $PROFILE --query resources"

# Test 3: Initialize Stealth Address Registry
Test-ContractFunction -TestName "Initialize Stealth Address Registry" -Command "aptos move run --profile $PROFILE --function-id $DEPLOYED_ADDRESS::$MODULE_NAME::initialize"

# Test 4: Register Stealth Address
$testScanKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
$testSpendKey = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"

Test-ContractFunction -TestName "Register Stealth Address" -Command "aptos move run --profile $PROFILE --function-id $DEPLOYED_ADDRESS::$MODULE_NAME::register_stealth_address --args hex:$testScanKey hex:$testSpendKey"

# Test 5: Get Stealth Address Info
Test-ContractFunction -TestName "Get Stealth Address Info" -Command "aptos move view --profile $PROFILE --function-id $DEPLOYED_ADDRESS::$MODULE_NAME::get_stealth_address_info --args address:$DEPLOYED_ADDRESS"

# Test 6: Check if Stealth Address is Active
Test-ContractFunction -TestName "Check Stealth Address Active Status" -Command "aptos move view --profile $PROFILE --function-id $DEPLOYED_ADDRESS::$MODULE_NAME::is_stealth_address_active --args address:$DEPLOYED_ADDRESS"

# Test 7: Create Stealth Payment (Mock)
$testAmount = "1000000"  # 0.001 APT in octas
$testEphemeralKey = "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba"

Test-ContractFunction -TestName "Create Stealth Payment" -Command "aptos move run --profile $PROFILE --function-id $DEPLOYED_ADDRESS::$MODULE_NAME::create_stealth_payment --args hex:$testEphemeralKey u64:$testAmount"

# Test 8: Get Stealth Payment Info
Test-ContractFunction -TestName "Get Stealth Payment Info" -Command "aptos move view --profile $PROFILE --function-id $DEPLOYED_ADDRESS::$MODULE_NAME::get_stealth_payment_info --args hex:$testEphemeralKey"

# Test 9: Check Payment Status
Test-ContractFunction -TestName "Check Payment Status" -Command "aptos move view --profile $PROFILE --function-id $DEPLOYED_ADDRESS::$MODULE_NAME::is_payment_claimed --args hex:$testEphemeralKey"

# Test 10: Claim Stealth Payment
$testSignature = "0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff"
Test-ContractFunction -TestName "Claim Stealth Payment" -Command "aptos move run --profile $PROFILE --function-id $DEPLOYED_ADDRESS::$MODULE_NAME::claim_stealth_payment --args hex:$testEphemeralKey hex:$testSignature"

# Test 11: Deactivate Stealth Address
Test-ContractFunction -TestName "Deactivate Stealth Address" -Command "aptos move run --profile $PROFILE --function-id $DEPLOYED_ADDRESS::$MODULE_NAME::deactivate_stealth_address"

# Test 12: Check Deactivated Status
Test-ContractFunction -TestName "Check Deactivated Status" -Command "aptos move view --profile $PROFILE --function-id $DEPLOYED_ADDRESS::$MODULE_NAME::is_stealth_address_active --args address:$DEPLOYED_ADDRESS"

# Test 13: Reactivate Stealth Address
Test-ContractFunction -TestName "Reactivate Stealth Address" -Command "aptos move run --profile $PROFILE --function-id $DEPLOYED_ADDRESS::$MODULE_NAME::reactivate_stealth_address"

# Test 14: Check Reactivated Status
Test-ContractFunction -TestName "Check Reactivated Status" -Command "aptos move view --profile $PROFILE --function-id $DEPLOYED_ADDRESS::$MODULE_NAME::is_stealth_address_active --args address:$DEPLOYED_ADDRESS"

# Test 15: Get All Stealth Payments
Test-ContractFunction -TestName "Get All Stealth Payments" -Command "aptos move view --profile $PROFILE --function-id $DEPLOYED_ADDRESS::$MODULE_NAME::get_all_stealth_payments --args address:$DEPLOYED_ADDRESS"

# Test 16: Get Stealth Address Statistics
Test-ContractFunction -TestName "Get Stealth Address Statistics" -Command "aptos move view --profile $PROFILE --function-id $DEPLOYED_ADDRESS::$MODULE_NAME::get_stealth_address_stats --args address:$DEPLOYED_ADDRESS"

# Final balance check
Check-AccountBalance

# Test Summary
Write-Host "`n📊 COMPREHENSIVE TEST RESULTS" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green
Write-Host "Total Tests Run: $testsRun" -ForegroundColor White
Write-Host "Tests Passed: $testsPassed" -ForegroundColor Green
Write-Host "Tests Failed: $testsFailed" -ForegroundColor Red

if ($testsFailed -eq 0) {
    Write-Host "`n🎉 ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "Your Furtim stealth address contracts are working perfectly!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Some tests failed. Check the output above for details." -ForegroundColor Yellow
}

Write-Host "`n🔗 Contract Explorer Link:" -ForegroundColor Cyan
Write-Host "https://explorer.aptoslabs.com/account/$DEPLOYED_ADDRESS?network=devnet" -ForegroundColor Blue

Write-Host "`n📝 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Review any failed tests above" -ForegroundColor White
Write-Host "2. Test with frontend integration" -ForegroundColor White
Write-Host "3. Deploy to testnet when ready" -ForegroundColor White
Write-Host "4. Deploy to mainnet for production" -ForegroundColor White

Write-Host "`n✨ Testing completed!" -ForegroundColor Green

