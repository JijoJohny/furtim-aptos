# View all deployment addresses
# This script shows you all your deployments across networks

Write-Host "Furtim Deployment Addresses" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan

# Check if deployment-addresses.json exists
if (-not (Test-Path "deployment-addresses.json")) {
    Write-Host "deployment-addresses.json not found. Run deployment scripts first." -ForegroundColor Red
    Write-Host ""
    Write-Host "Available deployment scripts:" -ForegroundColor Cyan
    Write-Host "  .\scripts\deploy-devnet-simple.ps1" -ForegroundColor White
    Write-Host "  .\scripts\deploy-testnet-simple.ps1" -ForegroundColor White
    exit 1
}

# Read the configuration
$config = Get-Content "deployment-addresses.json" | ConvertFrom-Json

Write-Host "Last updated: $($config.last_updated)" -ForegroundColor Cyan
Write-Host ""

# Display all deployments
foreach ($network in $config.deployments.PSObject.Properties.Name) {
    $deployment = $config.deployments.$network
    
    Write-Host "Network: $($deployment.network.ToUpper())" -ForegroundColor Yellow
    Write-Host "  Address: $($deployment.address)" -ForegroundColor White
    Write-Host "  Status: $($deployment.status)" -ForegroundColor White
    Write-Host "  RPC URL: $($deployment.rpc_url)" -ForegroundColor White
    Write-Host "  Explorer: $($deployment.explorer_url)" -ForegroundColor White
    
    if ($deployment.address -and $deployment.status -eq "deployed") {
        Write-Host "  Contract Functions:" -ForegroundColor Cyan
        Write-Host "    Initialize: $($deployment.address)::stealth_address::initialize" -ForegroundColor White
        Write-Host "    Register: $($deployment.address)::stealth_address::register_stealth_address" -ForegroundColor White
        Write-Host "    Create Payment: $($deployment.address)::stealth_address::create_stealth_payment" -ForegroundColor White
        Write-Host "    Claim Payment: $($deployment.address)::stealth_address::claim_stealth_payment" -ForegroundColor White
        Write-Host "    Deactivate: $($deployment.address)::stealth_address::deactivate_stealth_address" -ForegroundColor White
        Write-Host "    Reactivate: $($deployment.address)::stealth_address::reactivate_stealth_address" -ForegroundColor White
    }
    
    Write-Host ""
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "To update a deployment address:" -ForegroundColor Cyan
Write-Host "  .\scripts\update-deployment-address.ps1 -Network testnet -Address YOUR_ADDRESS" -ForegroundColor White
Write-Host ""
Write-Host "To deploy to a network:" -ForegroundColor Cyan
Write-Host "  .\scripts\deploy-devnet-simple.ps1" -ForegroundColor White
Write-Host "  .\scripts\deploy-testnet-simple.ps1" -ForegroundColor White
Write-Host "================================================================" -ForegroundColor Cyan
