# Manual Testnet Deployment Guide for Furtim
# This script guides you through the manual testnet deployment process

Write-Host "=== FURTIM TESTNET DEPLOYMENT GUIDE ===" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "STEP 1: Create Testnet Account" -ForegroundColor Yellow
Write-Host "Run this command and follow the prompts:" -ForegroundColor White
Write-Host "aptos init --profile testnet --network testnet" -ForegroundColor Cyan
Write-Host ""

Write-Host "STEP 2: Get Your Account Address" -ForegroundColor Yellow
Write-Host "After creating the account, run:" -ForegroundColor White
Write-Host "aptos account list --profile testnet" -ForegroundColor Cyan
Write-Host ""

Write-Host "STEP 3: Fund Your Account" -ForegroundColor Yellow
Write-Host "1. Visit: https://aptos.dev/network/faucet" -ForegroundColor White
Write-Host "2. Enter your account address from Step 2" -ForegroundColor White
Write-Host "3. Request testnet APT tokens" -ForegroundColor White
Write-Host "4. Wait for confirmation" -ForegroundColor White
Write-Host ""

Write-Host "STEP 4: Update Move.toml" -ForegroundColor Yellow
Write-Host "1. Copy your account address from Step 2" -ForegroundColor White
Write-Host "2. Edit move/Move.toml" -ForegroundColor White
Write-Host "3. Replace the furtim address with your account address" -ForegroundColor White
Write-Host ""

Write-Host "STEP 5: Deploy Contracts" -ForegroundColor Yellow
Write-Host "Run these commands:" -ForegroundColor White
Write-Host "cd move" -ForegroundColor Cyan
Write-Host "aptos move compile" -ForegroundColor Cyan
Write-Host "aptos move test" -ForegroundColor Cyan
Write-Host "aptos move publish --profile testnet" -ForegroundColor Cyan
Write-Host ""

Write-Host "STEP 6: Initialize Registry" -ForegroundColor Yellow
Write-Host "Replace YOUR_ADDRESS with your actual address:" -ForegroundColor White
Write-Host "aptos move run --profile testnet --function-id 'YOUR_ADDRESS::stealth_address::initialize'" -ForegroundColor Cyan
Write-Host ""

Write-Host "STEP 7: Verify Deployment" -ForegroundColor Yellow
Write-Host "aptos account list --profile testnet" -ForegroundColor Cyan
Write-Host ""

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Ready to start? Press any key to begin..." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "Starting Step 1: Creating testnet account..." -ForegroundColor Blue
Write-Host "Please follow the prompts to create your testnet account..." -ForegroundColor Yellow
Write-Host ""

# Step 1: Create account
Write-Host "Running: aptos init --profile testnet --network testnet" -ForegroundColor Cyan
aptos init --profile testnet --network testnet

Write-Host ""
Write-Host "Step 1 Complete! Now getting your account address..." -ForegroundColor Green

# Step 2: Get account address
Write-Host "Running: aptos account list --profile testnet" -ForegroundColor Cyan
$accountInfo = aptos account list --profile testnet
Write-Host "Account Info:" -ForegroundColor Yellow
Write-Host $accountInfo -ForegroundColor White

# Extract account address
$accountData = $accountInfo | ConvertFrom-Json
if ($accountData.Result -and $accountData.Result.Count -gt 0) {
    $accountAddress = $accountData.Result[0].address
    Write-Host ""
    Write-Host "YOUR ACCOUNT ADDRESS: $accountAddress" -ForegroundColor Yellow -BackgroundColor Black
    Write-Host ""
    Write-Host "STEP 3: FUND YOUR ACCOUNT" -ForegroundColor Red -BackgroundColor Yellow
    Write-Host "1. Go to: https://aptos.dev/network/faucet" -ForegroundColor White
    Write-Host "2. Enter this address: $accountAddress" -ForegroundColor Yellow
    Write-Host "3. Request testnet APT tokens" -ForegroundColor White
    Write-Host "4. Wait for confirmation, then press any key to continue..." -ForegroundColor Green
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
    Write-Host ""
    Write-Host "STEP 4: Updating Move.toml with your address..." -ForegroundColor Blue
    
    # Update Move.toml
    $moveTomlContent = @"
[package]
name = "furtim"
version = "0.0.1"

[dependencies]
AptosFramework = { git = "https://github.com/aptos-labs/aptos-core.git", subdir = "aptos-move/framework/aptos-framework", rev = "aptos-release-v1.20" }
AptosStdlib = { git = "https://github.com/aptos-labs/aptos-core.git", subdir = "aptos-move/framework/aptos-stdlib", rev = "aptos-release-v1.20" }
MoveStdlib = { git = "https://github.com/aptos-labs/aptos-core.git", subdir = "aptos-move/framework/move-stdlib", rev = "aptos-release-v1.20" }

[addresses]
furtim = "$accountAddress"
"@
    
    $moveTomlContent | Out-File -FilePath "move/Move.toml" -Encoding UTF8
    Write-Host "Move.toml updated with address: $accountAddress" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "STEP 5: Deploying contracts..." -ForegroundColor Blue
    Write-Host "This may take a few minutes..." -ForegroundColor Yellow
    
    # Navigate to move directory and deploy
    Set-Location move
    
    Write-Host "Compiling Move package..." -ForegroundColor Cyan
    aptos move compile
    
    Write-Host "Running Move tests..." -ForegroundColor Cyan
    aptos move test
    
    Write-Host "Deploying to testnet..." -ForegroundColor Cyan
    $deployResult = aptos move publish --profile testnet
    Write-Host "Deployment result:" -ForegroundColor Green
    Write-Host $deployResult -ForegroundColor White
    
    Write-Host ""
    Write-Host "STEP 6: Initializing stealth address registry..." -ForegroundColor Blue
    $initResult = aptos move run --profile testnet --function-id "${accountAddress}::stealth_address::initialize"
    Write-Host "Initialization result:" -ForegroundColor Green
    Write-Host $initResult -ForegroundColor White
    
    Write-Host ""
    Write-Host "STEP 7: Verifying deployment..." -ForegroundColor Blue
    aptos account list --profile testnet
    
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "DEPLOYMENT COMPLETE!" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "DEPLOYMENT SUMMARY:" -ForegroundColor Yellow -BackgroundColor Black
    Write-Host "   Network: Aptos Testnet" -ForegroundColor White
    Write-Host "   Account: testnet" -ForegroundColor White
    Write-Host "   DEPLOYMENT ADDRESS: $accountAddress" -ForegroundColor Yellow -BackgroundColor Black
    Write-Host ""
    Write-Host "CONTRACT FUNCTIONS:" -ForegroundColor Cyan
    Write-Host "   Initialize: ${accountAddress}::stealth_address::initialize" -ForegroundColor White
    Write-Host "   Register: ${accountAddress}::stealth_address::register_stealth_address" -ForegroundColor White
    Write-Host "   Create Payment: ${accountAddress}::stealth_address::create_stealth_payment" -ForegroundColor White
    Write-Host "   Claim Payment: ${accountAddress}::stealth_address::claim_stealth_payment" -ForegroundColor White
    Write-Host ""
    Write-Host "EXPLORER LINKS:" -ForegroundColor Cyan
    Write-Host "   Testnet Explorer: https://explorer.aptoslabs.com/?network=testnet" -ForegroundColor White
    Write-Host "   Your Account: https://explorer.aptoslabs.com/account/$accountAddress?network=testnet" -ForegroundColor White
    Write-Host ""
    Write-Host "SAVE THIS INFORMATION:" -ForegroundColor Red -BackgroundColor Yellow
    Write-Host "   DEPLOYMENT ADDRESS: $accountAddress" -ForegroundColor Yellow -BackgroundColor Black
    Write-Host "=========================================" -ForegroundColor Cyan
    
} else {
    Write-Host "Error: Could not extract account address" -ForegroundColor Red
    Write-Host "Please run the commands manually:" -ForegroundColor Yellow
    Write-Host "1. aptos init --profile testnet --network testnet" -ForegroundColor White
    Write-Host "2. aptos account list --profile testnet" -ForegroundColor White
    Write-Host "3. Follow the manual steps above" -ForegroundColor White
}
