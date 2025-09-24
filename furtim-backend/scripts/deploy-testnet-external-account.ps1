# Deploy Furtim Move contracts to Aptos Testnet using External Account
# PowerShell script for Windows

Write-Host "=== FURTIM TESTNET DEPLOYMENT WITH EXTERNAL ACCOUNT ===" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan

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

Write-Host ""
Write-Host "This script will help you deploy using your external account." -ForegroundColor Yellow
Write-Host "You'll need:" -ForegroundColor White
Write-Host "1. Your account's private key (hex format starting with 0x)" -ForegroundColor White
Write-Host "2. Your account address" -ForegroundColor White
Write-Host "3. Testnet APT tokens in your account" -ForegroundColor White
Write-Host ""

# Get account information from user
Write-Host "STEP 1: Enter your account information" -ForegroundColor Blue
Write-Host ""

$accountAddress = Read-Host "Enter your account address (hex format, e.g., 0x1234...)"
$privateKey = Read-Host "Enter your private key (hex format starting with 0x)" -AsSecureString
$privateKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($privateKey))

# Validate inputs
if (-not $accountAddress.StartsWith("0x")) {
    Write-Host "Error: Account address must start with 0x" -ForegroundColor Red
    exit 1
}

if (-not $privateKeyPlain.StartsWith("0x")) {
    Write-Host "Error: Private key must start with 0x" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Account Address: $accountAddress" -ForegroundColor Cyan
Write-Host "Private Key: $($privateKeyPlain.Substring(0, 10))..." -ForegroundColor Cyan
Write-Host ""

# Create or update testnet profile with external account
Write-Host "STEP 2: Configuring testnet profile with your account..." -ForegroundColor Blue

# Create a temporary config file for the profile
$configContent = @"
profiles:
  testnet:
    private_key: "$privateKeyPlain"
    public_key: ""
    account: $accountAddress
    rest_url: "https://fullnode.testnet.aptoslabs.com/v1"
    faucet_url: "https://faucet.testnet.aptoslabs.com"
"@

# Ensure .aptos directory exists
if (-not (Test-Path ".aptos")) {
    New-Item -ItemType Directory -Path ".aptos" -Force
}

# Write config
$configContent | Out-File -FilePath ".aptos/config.yaml" -Encoding UTF8 -Force

Write-Host "Testnet profile configured with your account" -ForegroundColor Green

# Check account balance
Write-Host ""
Write-Host "STEP 3: Checking account balance..." -ForegroundColor Blue
$balanceInfo = aptos account list --profile testnet
Write-Host "Account Info:" -ForegroundColor Yellow
Write-Host $balanceInfo -ForegroundColor White

# Check if account has sufficient balance
$balanceData = $balanceInfo | ConvertFrom-Json
$hasBalance = $false

if ($balanceData.Result -and $balanceData.Result.Count -gt 0) {
    $accountInfo = $balanceData.Result[0]
    if ($accountInfo.coins -and $accountInfo.coins.Count -gt 0) {
        $aptBalance = $accountInfo.coins | Where-Object { $_.coin_type -like "*0x1::aptos_coin::AptosCoin*" }
        if ($aptBalance -and [decimal]$aptBalance.amount -gt 0) {
            $hasBalance = $true
            Write-Host "Account has APT balance: $($aptBalance.amount) octas" -ForegroundColor Green
        }
    }
}

if (-not $hasBalance) {
    Write-Host ""
    Write-Host "WARNING: Account appears to have no APT balance!" -ForegroundColor Red -BackgroundColor Yellow
    Write-Host "You need testnet APT tokens to deploy contracts." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To get testnet APT:" -ForegroundColor Cyan
    Write-Host "1. Visit: https://aptos.dev/network/faucet" -ForegroundColor White
    Write-Host "2. Enter your address: $accountAddress" -ForegroundColor Yellow
    Write-Host "3. Request testnet APT tokens" -ForegroundColor White
    Write-Host "4. Wait for confirmation" -ForegroundColor White
    Write-Host ""
    Write-Host "Press any key after funding your account to continue..." -ForegroundColor Green
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Update Move.toml with the account address
Write-Host ""
Write-Host "STEP 4: Updating Move.toml with your account address..." -ForegroundColor Blue
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

# Compile the Move package
Write-Host ""
Write-Host "STEP 5: Compiling Move package..." -ForegroundColor Blue
Set-Location move
aptos move compile

# Test the compilation
Write-Host ""
Write-Host "STEP 6: Running Move tests..." -ForegroundColor Blue
aptos move test

# Deploy the package
Write-Host ""
Write-Host "STEP 7: Deploying package to testnet..." -ForegroundColor Blue
Write-Host "This may take a few minutes..." -ForegroundColor Yellow
$deployResult = aptos move publish --profile testnet
Write-Host "Deployment result:" -ForegroundColor Green
Write-Host $deployResult -ForegroundColor White

# Initialize the stealth address registry
Write-Host ""
Write-Host "STEP 8: Initializing stealth address registry..." -ForegroundColor Blue
Write-Host "Function ID: ${accountAddress}::stealth_address::initialize" -ForegroundColor Cyan
$initResult = aptos move run --profile testnet --function-id "${accountAddress}::stealth_address::initialize"
Write-Host "Initialization result:" -ForegroundColor Green
Write-Host $initResult -ForegroundColor White

# Verify deployment
Write-Host ""
Write-Host "STEP 9: Verifying deployment..." -ForegroundColor Blue
aptos account list --profile testnet

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "FURTIM DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "DEPLOYMENT SUMMARY:" -ForegroundColor Yellow -BackgroundColor Black
Write-Host "   Network: Aptos Testnet" -ForegroundColor White
Write-Host "   Account: External Account" -ForegroundColor White
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
Write-Host "=======================================================" -ForegroundColor Cyan

# Save deployment info to file
$deploymentInfo = @{
    network = "testnet"
    account_type = "external"
    deployment_address = $accountAddress
    deployment_date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    contract_functions = @{
        initialize = "${accountAddress}::stealth_address::initialize"
        register = "${accountAddress}::stealth_address::register_stealth_address"
        create_payment = "${accountAddress}::stealth_address::create_stealth_payment"
        claim_payment = "${accountAddress}::stealth_address::claim_stealth_payment"
        deactivate = "${accountAddress}::stealth_address::deactivate_stealth_address"
        reactivate = "${accountAddress}::stealth_address::reactivate_stealth_address"
    }
    explorer_links = @{
        testnet_explorer = "https://explorer.aptoslabs.com/?network=testnet"
        account_page = "https://explorer.aptoslabs.com/account/$accountAddress?network=testnet"
    }
}

$deploymentInfo | ConvertTo-Json -Depth 3 | Out-File -FilePath "../deployment-testnet-external.json" -Encoding UTF8
Write-Host ""
Write-Host "Deployment information saved to: deployment-testnet-external.json" -ForegroundColor Green
