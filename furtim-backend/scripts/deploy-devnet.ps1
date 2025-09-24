# Deploy Furtim Move contracts to Aptos Devnet
# PowerShell script for Windows

Write-Host "Starting Furtim Move contract deployment to Aptos Devnet..." -ForegroundColor Green

# Check if aptos CLI is installed
$aptosCheck = Get-Command aptos -ErrorAction SilentlyContinue
if ($aptosCheck) {
    Write-Host "✅ Aptos CLI found" -ForegroundColor Green
} else {
    Write-Host "❌ Aptos CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   curl -fsSL https://aptos.dev/scripts/install_cli.py | python3" -ForegroundColor Yellow
    exit 1
}

# Check if we're in the right directory
if (-not (Test-Path "move/Move.toml")) {
    Write-Host "❌ move/Move.toml not found. Make sure you're running this from the furtim-backend directory" -ForegroundColor Red
    exit 1
}

# Initialize Aptos configuration for devnet
Write-Host "📋 Setting up devnet configuration..." -ForegroundColor Blue
if (-not (Test-Path ".aptos/config.yaml")) {
    aptos init --profile devnet --network devnet
}

# Fund the account with test tokens from devnet faucet
Write-Host "💰 Funding account from devnet faucet..." -ForegroundColor Blue
aptos account fund-with-faucet --profile devnet --account devnet

# Check account balance
Write-Host "📊 Account balance:" -ForegroundColor Blue
aptos account list --profile devnet

# Get the account address for Move.toml
$accountInfo = aptos account list --profile devnet --query modules
$accountAddress = ($accountInfo | ConvertFrom-Json).Result[0].address
Write-Host "📝 Account address: $accountAddress" -ForegroundColor Green

# Update Move.toml with the account address
Write-Host "🔧 Updating Move.toml with account address..." -ForegroundColor Blue
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
Write-Host "🔨 Compiling Move package..." -ForegroundColor Blue
Set-Location move
aptos move compile

# Test the compilation
Write-Host "🧪 Running Move tests..." -ForegroundColor Blue
aptos move test

# Deploy the package
Write-Host "📦 Deploying package to devnet..." -ForegroundColor Blue
aptos move publish --profile devnet

# Initialize the stealth address registry
Write-Host "🔧 Initializing stealth address registry..." -ForegroundColor Blue
aptos move run --profile devnet --function-id "${accountAddress}::stealth_address::initialize"

# Verify deployment
Write-Host "✅ Verifying deployment..." -ForegroundColor Blue
aptos account list --profile devnet

Write-Host "🎉 Furtim stealth address contracts deployed successfully to devnet!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Deployment Summary:" -ForegroundColor Cyan
Write-Host "   - Network: Aptos Devnet" -ForegroundColor White
Write-Host "   - Account: devnet" -ForegroundColor White
Write-Host "   - Package: furtim" -ForegroundColor White
Write-Host "   - Module: stealth_address" -ForegroundColor White
Write-Host "   - Address: $accountAddress" -ForegroundColor White
Write-Host ""
Write-Host "🔗 View on Explorer:" -ForegroundColor Cyan
Write-Host "   https://explorer.aptoslabs.com/?network=devnet" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Test the contracts on devnet" -ForegroundColor White
Write-Host "   2. Deploy to testnet when ready" -ForegroundColor White
Write-Host "   3. Deploy to mainnet for production" -ForegroundColor White
