# Deploy Furtim Move contracts to Aptos Devnet - Fixed Version
# PowerShell script for Windows

Write-Host "Starting Furtim Move contract deployment to Aptos Devnet..." -ForegroundColor Green
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

# Initialize Aptos configuration for devnet
Write-Host "Setting up devnet configuration..." -ForegroundColor Blue
if (-not (Test-Path ".aptos/config.yaml")) {
    aptos init --profile devnet --network devnet
}

# Fund the account with test tokens from devnet faucet
Write-Host "Funding account from devnet faucet..." -ForegroundColor Blue
$fundResult = aptos account fund-with-faucet --profile devnet --account devnet
Write-Host "Fund result: $fundResult" -ForegroundColor Cyan

# Get the account address directly from the fund result
Write-Host "Extracting account address from fund result..." -ForegroundColor Blue
$fundData = $fundResult | ConvertFrom-Json
$accountAddress = $fundData.Result -replace "Added \d+ Octas to account ", ""
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
Write-Host "Deploying package to devnet..." -ForegroundColor Blue
Write-Host "This may take a few minutes..." -ForegroundColor Yellow
$deployResult = aptos move publish --profile devnet
Write-Host "Deployment result:" -ForegroundColor Green
Write-Host $deployResult -ForegroundColor White

# Initialize the stealth address registry
Write-Host "Initializing stealth address registry..." -ForegroundColor Blue
Write-Host "Function ID: ${accountAddress}::stealth_address::initialize" -ForegroundColor Cyan
$initResult = aptos move run --profile devnet --function-id "${accountAddress}::stealth_address::initialize"
Write-Host "Initialization result:" -ForegroundColor Green
Write-Host $initResult -ForegroundColor White

# Verify deployment
Write-Host "Verifying deployment..." -ForegroundColor Blue
aptos account list --profile devnet

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Furtim stealth address contracts deployed successfully to devnet!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "DEPLOYMENT SUMMARY:" -ForegroundColor Yellow -BackgroundColor Black
Write-Host "   Network: Aptos Devnet" -ForegroundColor White
Write-Host "   Account: devnet" -ForegroundColor White
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
Write-Host "   Devnet Explorer: https://explorer.aptoslabs.com/?network=devnet" -ForegroundColor White
Write-Host "   Your Account: https://explorer.aptoslabs.com/account/$accountAddress?network=devnet" -ForegroundColor White
Write-Host ""
Write-Host "BACKEND CONFIGURATION:" -ForegroundColor Cyan
Write-Host "   Update your backend with this address: $accountAddress" -ForegroundColor Yellow
Write-Host "   Network: devnet" -ForegroundColor White
Write-Host "   RPC URL: https://fullnode.devnet.aptoslabs.com/v1" -ForegroundColor White
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "   1. Test the contracts: .\scripts\test-devnet.ps1" -ForegroundColor White
Write-Host "   2. Update backend configuration" -ForegroundColor White
Write-Host "   3. Deploy to testnet when ready" -ForegroundColor White
Write-Host ""
Write-Host "SAVE THIS INFORMATION:" -ForegroundColor Red -BackgroundColor Yellow
Write-Host "   DEPLOYMENT ADDRESS: $accountAddress" -ForegroundColor Yellow -BackgroundColor Black
Write-Host "================================================================" -ForegroundColor Cyan
