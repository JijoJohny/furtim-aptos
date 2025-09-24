# Get deployment address for Furtim contracts
# This script helps you find your deployment address after deployment

Write-Host "Getting Furtim deployment address..." -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "move/Move.toml")) {
    Write-Host "move/Move.toml not found. Make sure you're running this from the furtim-backend directory" -ForegroundColor Red
    exit 1
}

# Function to get address for a specific network
function Get-DeploymentAddress {
    param($Network, $Profile)
    
    Write-Host "Checking $Network deployment..." -ForegroundColor Blue
    
    try {
        $accountInfo = aptos account list --profile $Profile --query modules
        $accountAddress = ($accountInfo | ConvertFrom-Json).Result[0].address
        
        if ($accountAddress) {
            Write-Host "DEPLOYMENT ADDRESS for $Network : $accountAddress" -ForegroundColor Yellow -BackgroundColor Black
            Write-Host "Explorer Link: https://explorer.aptoslabs.com/account/$accountAddress?network=$Network" -ForegroundColor Cyan
            return $accountAddress
        } else {
            Write-Host "No deployment found for $Network" -ForegroundColor Red
            return $null
        }
    } catch {
        Write-Host "Error checking $Network : $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Check all networks
Write-Host "Checking all available deployments..." -ForegroundColor Blue
Write-Host ""

# Check local deployment
$localAddress = Get-DeploymentAddress "local" "local"
if ($localAddress) {
    Write-Host "Local deployment found!" -ForegroundColor Green
}

Write-Host ""

# Check devnet deployment
$devnetAddress = Get-DeploymentAddress "devnet" "devnet"
if ($devnetAddress) {
    Write-Host "Devnet deployment found!" -ForegroundColor Green
}

Write-Host ""

# Check testnet deployment
$testnetAddress = Get-DeploymentAddress "testnet" "testnet"
if ($testnetAddress) {
    Write-Host "Testnet deployment found!" -ForegroundColor Green
}

Write-Host ""

# Summary
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT SUMMARY:" -ForegroundColor Yellow -BackgroundColor Black
Write-Host "================================================================" -ForegroundColor Cyan

if ($localAddress) {
    Write-Host "LOCAL: $localAddress" -ForegroundColor White
}
if ($devnetAddress) {
    Write-Host "DEVNET: $devnetAddress" -ForegroundColor White
}
if ($testnetAddress) {
    Write-Host "TESTNET: $testnetAddress" -ForegroundColor White
}

if (-not $localAddress -and -not $devnetAddress -and -not $testnetAddress) {
    Write-Host "No deployments found. Run deployment scripts first:" -ForegroundColor Red
    Write-Host "  .\scripts\deploy-devnet-simple.ps1" -ForegroundColor Yellow
    Write-Host "  .\scripts\deploy-testnet.ps1" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "To deploy to a specific network:" -ForegroundColor Cyan
Write-Host "  Devnet: .\scripts\deploy-devnet-simple.ps1" -ForegroundColor White
Write-Host "  Testnet: .\scripts\deploy-testnet.ps1" -ForegroundColor White
Write-Host "================================================================" -ForegroundColor Cyan
