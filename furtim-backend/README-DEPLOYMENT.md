# 🚀 Furtim Stealth Address Contracts - Local Deployment

This guide will help you deploy the Furtim stealth address contracts locally using the Aptos CLI on Windows.

## 📋 Prerequisites

### 1. Install Aptos CLI
```powershell
# Install Aptos CLI
curl -fsSL https://aptos.dev/scripts/install_cli.py | python3

# Verify installation
aptos --version
```

### 2. Install Docker Desktop
- Download and install Docker Desktop from https://www.docker.com/products/docker-desktop
- Ensure Docker Desktop is running

### 3. Install Node.js (for backend)
```powershell
# Install Node.js 18+ from https://nodejs.org/
node --version
npm --version
```

## 🚀 Quick Start (Windows)

### Step 1: Setup Local Aptos Node
```powershell
# Navigate to the backend directory
cd furtim-backend

# Setup local Aptos node
.\scripts\setup-local-node.ps1
```

### Step 2: Deploy Contracts
```powershell
# Deploy the stealth address contracts
.\scripts\deploy-local.ps1
```

### Step 3: Test Contracts
```powershell
# Test the deployed contracts
.\scripts\test-contracts.ps1
```

## 🔧 Manual Deployment Steps

If you prefer to run the commands manually:

### 1. Initialize Aptos Configuration
```powershell
# Initialize Aptos for local development
aptos init --profile local --network local
```

### 2. Start Local Node
```powershell
# Start local Aptos node with faucet
aptos node run-local-testnet --with-faucet
```

### 3. Fund Test Account
```powershell
# Fund your test account
aptos account fund-with-faucet --profile local --account local
```

### 4. Compile Move Package
```powershell
# Navigate to move directory
cd move

# Compile the package
aptos move compile --profile local

# Run tests
aptos move test --profile local
```

### 5. Deploy Package
```powershell
# Deploy the package
aptos move publish --profile local
```

### 6. Initialize Registry
```powershell
# Initialize the stealth address registry
aptos move run --profile local --function-id furtim::stealth_address::initialize
```

## 🧪 Testing the Contracts

### Run All Tests
```powershell
.\scripts\test-contracts.ps1
```

### Individual Test Commands
```powershell
# Test stealth address registration
aptos move run --profile local --function-id furtim::stealth_address::register_stealth_address --args "hex:0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" "hex:0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"

# Test stealth payment creation
aptos move run --profile local --function-id furtim::stealth_address::create_stealth_payment --args "address:0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" "hex:0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890" "u64:100" "string:USDC" "hex:0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"

# Test stealth payment claiming
aptos move run --profile local --function-id furtim::stealth_address::claim_stealth_payment --args "u64:1" "address:0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" "hex:0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890" "hex:0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Docker Not Running
```powershell
# Start Docker Desktop
# Or check if Docker service is running
docker --version
```

#### 2. Aptos CLI Not Found
```powershell
# Reinstall Aptos CLI
curl -fsSL https://aptos.dev/scripts/install_cli.py | python3

# Add to PATH if needed
$env:PATH += ";C:\Users\$env:USERNAME\.local\bin"
```

#### 3. Local Node Not Starting
```powershell
# Check if port 8080 is available
netstat -an | findstr :8080

# Kill any existing processes
Get-Process | Where-Object {$_.ProcessName -like "*aptos*"} | Stop-Process -Force
```

#### 4. Compilation Errors
```powershell
# Clean and recompile
cd move
Remove-Item -Recurse -Force build\ -ErrorAction SilentlyContinue
aptos move compile --profile local
```

#### 5. Deployment Errors
```powershell
# Check account balance
aptos account list --profile local

# Fund account if needed
aptos account fund-with-faucet --profile local --account local
```

### Debug Commands

#### Check Node Status
```powershell
# Check if node is running
Invoke-RestMethod -Uri "http://localhost:8080/v1" -Method Get
```

#### Check Account Balance
```powershell
aptos account list --profile local
```

#### View Transaction History
```powershell
aptos account list --profile local --query transactions
```

#### Check Module Status
```powershell
aptos account list --profile local --query modules
```

## 🔗 Integration with Backend

### 1. Update Backend Configuration
```typescript
// In your backend config
const APTOS_NETWORK = 'local';
const APTOS_NODE_URL = 'http://localhost:8080';
const APTOS_FAUCET_URL = 'http://localhost:8081';
```

### 2. Start Backend Indexer
```powershell
# Start the backend indexer
npm run dev

# The indexer will monitor the local node for stealth transactions
```

### 3. Test End-to-End Flow
```powershell
# 1. Deploy contracts (done above)
# 2. Start backend indexer
# 3. Start frontend
# 4. Test stealth payment flow
```

## 📊 Contract Functions

### Core Functions

#### 1. Register Stealth Address
```powershell
aptos move run --profile local --function-id furtim::stealth_address::register_stealth_address --args "hex:<scan_public_key>" "hex:<spend_public_key>"
```

#### 2. Create Stealth Payment
```powershell
aptos move run --profile local --function-id furtim::stealth_address::create_stealth_payment --args "address:<stealth_address>" "hex:<ephemeral_public_key>" "u64:<amount>" "string:<coin_type>" "hex:<tx_hash>"
```

#### 3. Claim Stealth Payment
```powershell
aptos move run --profile local --function-id furtim::stealth_address::claim_stealth_payment --args "u64:<payment_id>" "address:<stealth_address>" "hex:<ephemeral_public_key>" "hex:<shared_secret_proof>"
```

#### 4. Get Stealth Address Info
```powershell
aptos move view --profile local --function-id furtim::stealth_address::get_stealth_address_info --args "address:<stealth_address>"
```

#### 5. Deactivate/Reactivate Stealth Address
```powershell
# Deactivate
aptos move run --profile local --function-id furtim::stealth_address::deactivate_stealth_address

# Reactivate
aptos move run --profile local --function-id furtim::stealth_address::reactivate_stealth_address
```

## 🚀 Next Steps

### 1. Deploy to Testnet
```powershell
# Switch to testnet
aptos init --profile testnet --network testnet

# Deploy to testnet
aptos move publish --profile testnet
```

### 2. Deploy to Mainnet
```powershell
# Switch to mainnet
aptos init --profile mainnet --network mainnet

# Deploy to mainnet (production)
aptos move publish --profile mainnet
```

### 3. Monitor Production
```powershell
# Use the monitoring service
npm run monitor

# Check system health
Invoke-RestMethod -Uri "http://localhost:3001/api/stealth/indexer/status" -Method Get
```

## 🆘 Support

If you encounter issues:

1. Check the logs: `Get-Content .aptos\logs\*.log`
2. Verify Docker is running: `docker ps`
3. Check node status: `Invoke-RestMethod -Uri "http://localhost:8080/v1" -Method Get`
4. Review Aptos documentation: https://aptos.dev/

## 🔒 Security Notes

- **Never use real private keys in local development**
- **Test thoroughly before deploying to mainnet**
- **Use proper key management in production**
- **Monitor for security vulnerabilities**

## 📚 Additional Resources

- [Aptos Documentation](https://aptos.dev/)
- [Move Language Documentation](https://move-language.github.io/move/)
- [Aptos CLI Reference](https://aptos.dev/cli/)
- [Docker Desktop Documentation](https://docs.docker.com/desktop/)
