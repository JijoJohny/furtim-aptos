# Configure External Account for Aptos Testnet
# This script helps you configure your external account for deployment

Write-Host "=== CONFIGURE EXTERNAL ACCOUNT FOR TESTNET ===" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "This script will configure your external account for testnet deployment." -ForegroundColor Yellow
Write-Host "You'll need:" -ForegroundColor White
Write-Host "1. Your account's private key (hex format starting with 0x)" -ForegroundColor White
Write-Host "2. Your account address" -ForegroundColor White
Write-Host ""

# Get account information from user
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
Write-Host "Configuring testnet profile with your account..." -ForegroundColor Blue

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
Write-Host "Checking account balance..." -ForegroundColor Blue
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
} else {
    Write-Host ""
    Write-Host "Account is ready for deployment!" -ForegroundColor Green
    Write-Host "You can now run: .\scripts\deploy-testnet-external-account.ps1" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Configuration complete!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
