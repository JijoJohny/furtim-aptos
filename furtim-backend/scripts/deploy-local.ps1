# Deploy Furtim Move contracts locally using Aptos CLI
# PowerShell script for Windows

Write-Host "`u{1F680} Starting Furtim Move contract deployment to local Aptos node..." -ForegroundColor Green

# Check if aptos CLI is installed
try {
    $aptosVersion = aptos --version
    Write-Host "✅ Aptos CLI found: $aptosVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Aptos CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   curl -fsSL https://aptos.dev/scripts/install_cli.py | python3" -ForegroundColor Yellow
    exit 1
}

# Check if we're in the right directory
if (-not (Test-Path "move/Aptos.toml")) {
    Write-Host "❌ Please run this script from the furtim-backend directory" -ForegroundColor Red
    exit 1
}

# Create local test account if it doesn't exist
Write-Host "`u{1F4CB} Setting up local test account..." -ForegroundColor Blue
if (-not (Test-Path ".aptos/config.yaml")) {
    aptos init --profile local --network local
}

# Fund the account with test tokens
Write-Host "`u{1F4B0} Funding test account..." -ForegroundColor Blue
aptos account fund-with-faucet --profile local --account local

# Check account balance
Write-Host "`u{1F4CA} Account balance:" -ForegroundColor Blue
aptos account list --profile local

# Compile the Move package
Write-Host "`u{1F528} Compiling Move package..." -ForegroundColor Blue
Set-Location move
aptos move compile

# Test the compilation
Write-Host "`u{1F9EA} Running Move tests..." -ForegroundColor Blue
aptos move test

# Deploy the package
Write-Host "`u{1F4E6} Deploying package to local node..." -ForegroundColor Blue
aptos move publish --profile local

# Initialize the stealth address registry
Write-Host "`u{1F527} Initializing stealth address registry..." -ForegroundColor Blue
# Get the deployed address first
$deployedAddress = (aptos account list --profile local --query modules | ConvertFrom-Json).Result[0].address
aptos move run --profile local --function-id "${deployedAddress}::stealth_address::initialize"

# Verify deployment
Write-Host "✅ Verifying deployment..." -ForegroundColor Blue
aptos account list --profile local

Write-Host "`u{1F389} Furtim stealth address contracts deployed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "`u{1F4CB} Deployment Summary:" -ForegroundColor Cyan
Write-Host "   - Network: Local Aptos node" -ForegroundColor White
Write-Host "   - Account: local" -ForegroundColor White
Write-Host "   - Package: furtim" -ForegroundColor White
Write-Host "   - Module: stealth_address" -ForegroundColor White
Write-Host ""
Write-Host "`u{1F517} Next steps:" -ForegroundColor Cyan
Write-Host "   1. Start your backend indexer" -ForegroundColor White
Write-Host "   2. Test the stealth address functionality" -ForegroundColor White
Write-Host "   3. Deploy to testnet when ready" -ForegroundColor White
