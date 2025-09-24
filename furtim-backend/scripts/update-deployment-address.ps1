# Update deployment addresses in deployment-addresses.json
# This script helps you track your deployments across networks

param(
    [Parameter(Mandatory=$true)]
    [string]$Network,
    
    [Parameter(Mandatory=$true)]
    [string]$Address
)

Write-Host "Updating deployment address for $Network..." -ForegroundColor Green

# Check if deployment-addresses.json exists
if (-not (Test-Path "deployment-addresses.json")) {
    Write-Host "deployment-addresses.json not found. Creating it..." -ForegroundColor Yellow
    # Create the file with default structure
    $defaultConfig = @{
        deployments = @{
            local = @{
                address = ""
                network = "local"
                rpc_url = "http://localhost:8080/v1"
                explorer_url = "https://explorer.aptoslabs.com/?network=local"
                status = "not_deployed"
            }
            devnet = @{
                address = ""
                network = "devnet"
                rpc_url = "https://fullnode.devnet.aptoslabs.com/v1"
                explorer_url = "https://explorer.aptoslabs.com/?network=devnet"
                status = "not_deployed"
            }
            testnet = @{
                address = ""
                network = "testnet"
                rpc_url = "https://fullnode.testnet.aptoslabs.com/v1"
                explorer_url = "https://explorer.aptoslabs.com/?network=testnet"
                status = "not_deployed"
            }
            mainnet = @{
                address = ""
                network = "mainnet"
                rpc_url = "https://fullnode.mainnet.aptoslabs.com/v1"
                explorer_url = "https://explorer.aptoslabs.com/?network=mainnet"
                status = "not_deployed"
            }
        }
        contract_functions = @{
            initialize = "{address}::stealth_address::initialize"
            register_stealth_address = "{address}::stealth_address::register_stealth_address"
            create_stealth_payment = "{address}::stealth_address::create_stealth_payment"
            claim_stealth_payment = "{address}::stealth_address::claim_stealth_payment"
            deactivate_stealth_address = "{address}::stealth_address::deactivate_stealth_address"
            reactivate_stealth_address = "{address}::stealth_address::reactivate_stealth_address"
        }
        last_updated = ""
        notes = "This file stores deployment addresses for different networks. Update after each deployment."
    }
    
    $defaultConfig | ConvertTo-Json -Depth 10 | Out-File -FilePath "deployment-addresses.json" -Encoding UTF8
}

# Read the current configuration
$config = Get-Content "deployment-addresses.json" | ConvertFrom-Json

# Update the deployment address
if ($config.deployments.$Network) {
    $config.deployments.$Network.address = $Address
    $config.deployments.$Network.status = "deployed"
    $config.last_updated = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    # Save the updated configuration
    $config | ConvertTo-Json -Depth 10 | Out-File -FilePath "deployment-addresses.json" -Encoding UTF8
    
    Write-Host "Updated deployment address for $Network : $Address" -ForegroundColor Green
    Write-Host "Status: deployed" -ForegroundColor Green
    Write-Host "Last updated: $($config.last_updated)" -ForegroundColor Cyan
    
    # Display the updated configuration
    Write-Host ""
    Write-Host "Updated deployment-addresses.json:" -ForegroundColor Cyan
    Write-Host "Network: $Network" -ForegroundColor White
    Write-Host "Address: $Address" -ForegroundColor White
    Write-Host "Status: deployed" -ForegroundColor White
    Write-Host "Explorer: $($config.deployments.$Network.explorer_url)" -ForegroundColor White
    
} else {
    Write-Host "Network $Network not found in configuration" -ForegroundColor Red
    Write-Host "Available networks: $($config.deployments.PSObject.Properties.Name -join ', ')" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "To view all deployments:" -ForegroundColor Cyan
Write-Host "Get-Content deployment-addresses.json | ConvertFrom-Json" -ForegroundColor White
