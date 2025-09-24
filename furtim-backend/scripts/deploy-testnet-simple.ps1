# Deploy Furtim Move contracts to Aptos Testnet
# Simple PowerShell script for Windows

Write-Host "Starting Furtim Move contract deployment to Aptos Testnet..." -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan

# Check if aptos CLI is installed
$aptosCheck = Get-Command aptos -ErrorAction SilentlyContinue
if ($aptosCheck) {
    Write-Host "Aptos CLI found" -ForegroundColor Green
} else {
    Write-Host "Aptos CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "curl -fsSL https://aptos.dev/scripts/install_cli.py | python3" -ForegroundColor Yellow
    exit 1
}

# Check if we're in the right directory
if (-not (Test-Path "move/Move.toml")) {
    Write-Host "move/Move.toml not found. Make sure you're running this from the furtim-backend directory" -ForegroundColor Red
    exit 1
}

# Initialize Aptos configuration for testnet
Write-Host "Setting up testnet configuration..." -ForegroundColor Blue
if (-not (Test-Path ".aptos/config.yaml")) {
    aptos init --profile testnet --network testnet
}

# Fund the account with test tokens from testnet faucet
Write-Host "Funding account from testnet faucet..." -ForegroundColor Blue
aptos account fund-with-faucet --profile testnet --account testnet

# Check account balance
Write-Host "Account balance:" -ForegroundColor Blue
aptos account list --profile testnet

# Get the account address for Move.toml
Write-Host "Retrieving account information..." -ForegroundColor Blue
$accountInfo = aptos account list --profile testnet --query modules
$accountAddress = ($accountInfo | ConvertFrom-Json).Result[0].address
Write-Host "DEPLOYMENT ADDRESS: $accountAddress" -ForegroundColor Yellow -BackgroundColor Black
Write-Host "This is your contract deployment address!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan

# Update Move.toml with the account address
Write-Host "Updating Move.toml with account address..." -ForegroundColor Blue
$moveTomlContent = @"
[package]
name = "furtim"
version = "0.0.1"

[dependencies]
AptosFramework = { git = "https://github.com/aptos-labs/aptos-core.git", subdir = "aptos-move/framework/aptos-framework", rev = "aptos-release-v1.20" }

[addresses]
furtim = "$accountAddress"
"@
$moveTomlContent | Out-File -FilePath "move/Move.toml" -Encoding UTF8

# Compile the Move package
Write-Host "Compiling Move package..." -ForegroundColor Blue
Set-Location move
aptos move compile

# Test the compilation
Write-Host "Running Move tests..." -ForegroundColor Blue
aptos move test

# Deploy the package
Write-Host "Deploying package to testnet..." -ForegroundColor Blue
Write-Host "This may take a few minutes..." -ForegroundColor Yellow
$deployResult = aptos move publish --profile testnet
Write-Host "Deployment result:" -ForegroundColor Green
Write-Host $deployResult -ForegroundColor White

# Initialize the stealth address registry
Write-Host "Initializing stealth address registry..." -ForegroundColor Blue
Write-Host "Function ID: ${accountAddress}::stealth_address::initialize" -ForegroundColor Cyan
$initResult = aptos move run --profile testnet --function-id "${accountAddress}::stealth_address::initialize"
Write-Host "Initialization result:" -ForegroundColor Green
Write-Host $initResult -ForegroundColor White

# Verify deployment
Write-Host "Verifying deployment..." -ForegroundColor Blue
aptos account list --profile testnet

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Furtim stealth address contracts deployed successfully to testnet!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "DEPLOYMENT SUMMARY:" -ForegroundColor Yellow -BackgroundColor Black
Write-Host "   Network: Aptos Testnet" -ForegroundColor White
Write-Host "   Account: testnet" -ForegroundColor White
Write-Host "   Package: furtim" -ForegroundColor White
Write-Host "   Module: stealth_address" -ForegroundColor White
Write-Host "   DEPLOYMENT ADDRESS: $accountAddress" -ForegroundColor Yellow -BackgroundColor Black
Write-Host ""
Write-Host "CONTRACT FUNCTIONS:" -ForegroundColor Cyan
Write-Host "   Initialize: ${accountAddress}::stealth_address::initialize" -ForegroundColor White
Write-Host "   Register: ${accountAddress}::stealth_address::register_stealth_address" -ForegroundColor White
Write-Host "   Create Payment: ${accountAddress}::stealth_address::create_stealth_payment" -ForegroundColor White
Write-Host "   Claim Payment: ${accountAddress}::stealth_address::claim_stealth_payment" -ForegroundColor White
Write-Host "   Deactivate: ${accountAddress}::stealth_address::deactivate_stealth_address" -ForegroundColor White
Write-Host "   Reactivate: ${accountAddress}::stealth_address::reactivate_stealth_address" -ForegroundColor White
Write-Host ""
Write-Host "EXPLORER LINKS:" -ForegroundColor Cyan
Write-Host "   Testnet Explorer: https://explorer.aptoslabs.com/?network=testnet" -ForegroundColor White
Write-Host "   Your Account: https://explorer.aptoslabs.com/account/$accountAddress?network=testnet" -ForegroundColor White
Write-Host ""
Write-Host "BACKEND CONFIGURATION:" -ForegroundColor Cyan
Write-Host "   Update your backend with this address: $accountAddress" -ForegroundColor Yellow
Write-Host "   Network: testnet" -ForegroundColor White
Write-Host "   RPC URL: https://fullnode.testnet.aptoslabs.com/v1" -ForegroundColor White
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "   1. Test the contracts: .\scripts\test-testnet.ps1" -ForegroundColor White
Write-Host "   2. Update backend configuration" -ForegroundColor White
Write-Host "   3. Deploy to mainnet for production" -ForegroundColor White
Write-Host ""
Write-Host "SAVE THIS INFORMATION:" -ForegroundColor Red -BackgroundColor Yellow
Write-Host "   DEPLOYMENT ADDRESS: $accountAddress" -ForegroundColor Yellow -BackgroundColor Black
Write-Host "================================================================" -ForegroundColor Cyan
