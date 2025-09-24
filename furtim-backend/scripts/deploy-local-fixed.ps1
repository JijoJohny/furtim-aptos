# Deploy Furtim Move contracts locally using Aptos CLI
# Fixed PowerShell script for Windows

Write-Host "Starting Furtim Move contract deployment to local Aptos node..." -ForegroundColor Green

# Check if aptos CLI is installed
try {
    $aptosVersion = aptos --version
    Write-Host "Aptos CLI found: $aptosVersion" -ForegroundColor Green
} catch {
    Write-Host "Aptos CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   curl -fsSL https://aptos.dev/scripts/install_cli.py | python3" -ForegroundColor Yellow
    exit 1
}

# Check if we're in the right directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$moveTomlPath = Join-Path $scriptDir "move\Aptos.toml"
if (-not (Test-Path $moveTomlPath)) {
    Write-Host "move/Aptos.toml not found. Make sure you're running this from the furtim-backend directory" -ForegroundColor Red
    exit 1
}

# Set local account address here
$localAccount = "0x1940a668edefccee50f116ea193b6c040e65395561158e662d32b6ab427cbbd8"

# Create local test account if it doesn't exist
Write-Host "Setting up local test account..." -ForegroundColor Blue
if (-not (Test-Path ".aptos/config.yaml")) {
    aptos init --profile local --network local
}

# Fund the account with test tokens
Write-Host "Funding test account..." -ForegroundColor Blue
aptos account fund-with-faucet --profile local --account local

# Check account balance
Write-Host "Account balance:" -ForegroundColor Blue
aptos account list --profile local

# Navigate to move directory
Set-Location "$scriptDir\move"

# Compile the Move package
Write-Host "Compiling Move package..." -ForegroundColor Blue
aptos move compile --package-dir . --named-addresses local=$localAccount

# Test the compilation
Write-Host "Running Move tests..." -ForegroundColor Blue
aptos move test --package-dir . --named-addresses local=$localAccount

# Deploy the package
Write-Host "Deploying package to local node..." -ForegroundColor Blue
aptos move publish --package-dir . --named-addresses local=$localAccount

# Initialize the stealth address registry
Write-Host "Initializing stealth address registry..." -ForegroundColor Blue
aptos move run --function-id "$localAccount::stealth_address::initialize"

# Verify deployment
Write-Host "Verifying deployment..." -ForegroundColor Blue
aptos account list --profile local

Write-Host "Furtim stealth address contracts deployed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Deployment Summary:" -ForegroundColor Cyan
Write-Host "   - Network: Local Aptos node" -ForegroundColor White
Write-Host "   - Account: local" -ForegroundColor White
Write-Host "   - Package: furtim" -ForegroundColor White
Write-Host "   - Module: stealth_address" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "   1. Start your backend indexer" -ForegroundColor White
Write-Host "   2. Test the stealth address functionality" -ForegroundColor White
Write-Host "   3. Deploy to testnet when ready" -ForegroundColor White
