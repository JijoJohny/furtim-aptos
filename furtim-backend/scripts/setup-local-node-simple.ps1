# Setup local Aptos node for development
# Simple PowerShell script for Windows

Write-Host "Setting up local Aptos development environment..." -ForegroundColor Green

# Check if aptos CLI is installed
$aptosCheck = Get-Command aptos -ErrorAction SilentlyContinue
if ($aptosCheck) {
    Write-Host "Aptos CLI found" -ForegroundColor Green
} else {
    Write-Host "Aptos CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "curl -fsSL https://aptos.dev/scripts/install_cli.py | python3" -ForegroundColor Yellow
    exit 1
}

# Check if Docker is running
$dockerCheck = Get-Command docker -ErrorAction SilentlyContinue
if ($dockerCheck) {
    Write-Host "Docker is available" -ForegroundColor Green
} else {
    Write-Host "Docker is not available. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Create .aptos directory if it doesn't exist
if (-not (Test-Path ".aptos")) {
    New-Item -ItemType Directory -Path ".aptos" | Out-Null
}

# Initialize Aptos configuration
Write-Host "Initializing Aptos configuration..." -ForegroundColor Blue
aptos init --profile local --network local

# Start local Aptos node
Write-Host "Starting local Aptos node..." -ForegroundColor Blue
Write-Host "This will start a Docker container with a local Aptos node." -ForegroundColor Yellow
Write-Host "The node will be available at http://localhost:8080" -ForegroundColor Yellow
Write-Host ""

# Start the node in the background
Start-Process -FilePath "aptos" -ArgumentList "node", "run-local-testnet", "--with-faucet" -WindowStyle Hidden

# Wait for node to start
Write-Host "Waiting for local node to start..." -ForegroundColor Blue
Start-Sleep -Seconds 15

# Check if node is running
Write-Host "Checking node status..." -ForegroundColor Blue
$nodeResponse = Invoke-RestMethod -Uri "http://localhost:8080/v1" -Method Get -ErrorAction SilentlyContinue

if ($nodeResponse) {
    Write-Host "Local Aptos node is running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Node Information:" -ForegroundColor Cyan
    Write-Host "   - REST API: http://localhost:8080" -ForegroundColor White
    Write-Host "   - Faucet: http://localhost:8081" -ForegroundColor White
    Write-Host "   - Network: local" -ForegroundColor White
    Write-Host ""
    Write-Host "Test Account:" -ForegroundColor Cyan
    aptos account list --profile local
    Write-Host ""
    Write-Host "Fund your account:" -ForegroundColor Cyan
    Write-Host "aptos account fund-with-faucet --profile local --account local" -ForegroundColor White
    Write-Host ""
    Write-Host "Deploy contracts:" -ForegroundColor Cyan
    Write-Host ".\scripts\deploy-local.ps1" -ForegroundColor White
} else {
    Write-Host "Failed to start local node. Please check Docker and try again." -ForegroundColor Red
    exit 1
}
