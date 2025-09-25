# Testnet Testing Script that reads deployment configuration
# Automatically uses the correct deployment address from config files

Write-Host "=== FURTIM TESTNET TESTING (FROM CONFIG) ===" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan

# Read deployment configuration
$configPath = "deployment-testnet-external.json"
if (Test-Path $configPath) {
    $config = Get-Content $configPath | ConvertFrom-Json
    $DEPLOYED_ADDRESS = $config.deployment_address
    $NETWORK = $config.network
    $DEPLOYMENT_DATE = $config.deployment_date
    
    Write-Host "Configuration loaded from: $configPath" -ForegroundColor Green
    Write-Host "Deployment Date: $DEPLOYMENT_DATE" -ForegroundColor White
} else {
    Write-Host "Configuration file not found: $configPath" -ForegroundColor Red
    Write-Host "Using default testnet address..." -ForegroundColor Yellow
    $DEPLOYED_ADDRESS = "0x2e04b9fdd49ae932c8b08f04540363233093fec62579139722eb4b6a9f33464c"
    $NETWORK = "testnet"
}

$PROFILE = "testnet"
$MODULE_NAME = "stealth_address"

Write-Host "Deployed Address: $DEPLOYED_ADDRESS" -ForegroundColor White
Write-Host "Profile: $PROFILE" -ForegroundColor White
Write-Host "Network: $NETWORK" -ForegroundColor White
Write-Host ""

# Function to test contract functions
function Test-ContractFunction {
    param(
        [string]$TestName,
        [string]$FunctionId,
        [string]$Args = "",
        [string]$ExpectedResult = "success"
    )
    
    Write-Host "Test: $TestName" -ForegroundColor Blue
    
    $command = "aptos move run --profile $PROFILE --function-id `"$FunctionId`""
    if ($Args -ne "") {
        $command += " --args $Args"
    }
    $command += " --assume-yes"
    
    try {
        $result = Invoke-Expression $command
        
        if ($result -match "success|Executed successfully") {
            Write-Host "PASS: $TestName" -ForegroundColor Green
            return $true
        } elseif ($result -match "E_REGISTRY_ALREADY_EXISTS") {
            Write-Host "PASS: $TestName (registry already exists - expected)" -ForegroundColor Green
            return $true
        } else {
            Write-Host "FAIL: $TestName" -ForegroundColor Red
            Write-Host "Result: $result" -ForegroundColor Yellow
            return $false
        }
    }
    catch {
        Write-Host "ERROR: $TestName" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
        return $false
    }
}

# Function to test view functions
function Test-ViewFunction {
    param(
        [string]$TestName,
        [string]$FunctionId,
        [string]$Args = ""
    )
    
    Write-Host "Test: $TestName" -ForegroundColor Blue
    
    $command = "aptos move view --profile $PROFILE --function-id `"$FunctionId`""
    if ($Args -ne "") {
        $command += " --args $Args"
    }
    
    try {
        $result = Invoke-Expression $command
        Write-Host "RESULT: $result" -ForegroundColor White
        return $true
    }
    catch {
        Write-Host "ERROR: $TestName" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
        return $false
    }
}

# Test counters
$testsRun = 0
$testsPassed = 0

# Test 1: Verify Deployment
Write-Host "Test 1: Verifying contract deployment..." -ForegroundColor Blue
$modules = aptos account list --profile $PROFILE --query modules
if ($modules -match $DEPLOYED_ADDRESS) {
    Write-Host "PASS: Contract deployed successfully" -ForegroundColor Green
    $testsPassed++
} else {
    Write-Host "FAIL: Contract deployment verification failed" -ForegroundColor Red
}
$testsRun++

# Test 2: Initialize Registry
$initFunction = "$DEPLOYED_ADDRESS::$MODULE_NAME::initialize"
if (Test-ContractFunction -TestName "Initialize Registry" -FunctionId $initFunction) {
    $testsPassed++
}
$testsRun++

# Test 3: Register Stealth Address
$registerFunction = "$DEPLOYED_ADDRESS::$MODULE_NAME::register_stealth_address"
$scanKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
$spendKey = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
$registerArgs = "hex:$scanKey hex:$spendKey"

if (Test-ContractFunction -TestName "Register Stealth Address" -FunctionId $registerFunction -Args $registerArgs) {
    $testsPassed++
}
$testsRun++

# Test 4: Create Stealth Payment
$paymentFunction = "$DEPLOYED_ADDRESS::$MODULE_NAME::create_stealth_payment"
$amount = 1000000
$ephemeralKey = "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba"
$description = "Test payment"
$signature = "0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff"
$paymentArgs = "address:$DEPLOYED_ADDRESS hex:$ephemeralKey u64:$amount string:$description hex:$signature"

if (Test-ContractFunction -TestName "Create Stealth Payment" -FunctionId $paymentFunction -Args $paymentArgs) {
    $testsPassed++
}
$testsRun++

# Test 5: Claim Stealth Payment
$claimFunction = "$DEPLOYED_ADDRESS::$MODULE_NAME::claim_stealth_payment"
$claimArgs = "address:$DEPLOYED_ADDRESS u64:$amount hex:$ephemeralKey hex:$signature"

if (Test-ContractFunction -TestName "Claim Stealth Payment" -FunctionId $claimFunction -Args $claimArgs) {
    $testsPassed++
}
$testsRun++

# Test 6: Deactivate and Reactivate
$deactivateFunction = "$DEPLOYED_ADDRESS::$MODULE_NAME::deactivate_stealth_address"
if (Test-ContractFunction -TestName "Deactivate Stealth Address" -FunctionId $deactivateFunction) {
    $testsPassed++
}
$testsRun++

$reactivateFunction = "$DEPLOYED_ADDRESS::$MODULE_NAME::reactivate_stealth_address"
$reactivateArgs = "hex:$scanKey hex:$spendKey"
if (Test-ContractFunction -TestName "Reactivate Stealth Address" -FunctionId $reactivateFunction -Args $reactivateArgs) {
    $testsPassed++
}
$testsRun++

# Test Summary
Write-Host ""
Write-Host "=== TESTNET TEST RESULTS ===" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green
Write-Host "Total Tests: $testsRun" -ForegroundColor White
Write-Host "Tests Passed: $testsPassed" -ForegroundColor Green
Write-Host "Tests Failed: $($testsRun - $testsPassed)" -ForegroundColor Red

$successRate = [math]::Round(($testsPassed / $testsRun) * 100, 2)
Write-Host "Success Rate: $successRate%" -ForegroundColor Cyan

Write-Host ""
Write-Host "Contract Details:" -ForegroundColor Cyan
Write-Host "- Address: $DEPLOYED_ADDRESS" -ForegroundColor White
Write-Host "- Network: $NETWORK" -ForegroundColor White
Write-Host "- Profile: $PROFILE" -ForegroundColor White

Write-Host ""
Write-Host "Explorer Links:" -ForegroundColor Cyan
Write-Host "- Account: https://explorer.aptoslabs.com/account/$DEPLOYED_ADDRESS?network=$NETWORK" -ForegroundColor Blue

Write-Host ""
Write-Host "Testing completed!" -ForegroundColor Green
