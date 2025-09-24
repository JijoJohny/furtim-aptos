# Furtim Stealth Address Contracts - Local Deployment Guide

This guide will help you deploy the Furtim stealth address contracts locally using the Aptos CLI.

## Prerequisites

### 1. Install Aptos CLI
```bash
# Install Aptos CLI
curl -fsSL https://aptos.dev/scripts/install_cli.py | python3

# Verify installation
aptos --version
```

### 2. Install Docker
- Download and install Docker Desktop
- Ensure Docker is running

### 3. Install Node.js (for backend)
```bash
# Install Node.js 18+
node --version
npm --version
```

## Quick Start

### 1. Setup Local Aptos Node
```bash
# Navigate to the backend directory
cd furtim-backend

# Setup local Aptos node
./scripts/setup-local-node.sh
```

### 2. Deploy Contracts
```bash
# Deploy the stealth address contracts
./scripts/deploy-local.sh
```

### 3. Test Contracts
```bash
# Test the deployed contracts
./scripts/test-contracts.sh
```

### 4. Cleanup (when done)
```bash
# Clean up local environment
./scripts/cleanup-local.sh
```

## Manual Deployment Steps

If you prefer to run the commands manually:

### 1. Initialize Aptos Configuration
```bash
# Initialize Aptos for local development
aptos init --profile local --network local
```

### 2. Start Local Node
```bash
# Start local Aptos node with faucet
aptos node run-local-testnet --with-faucet
```

### 3. Fund Test Account
```bash
# Fund your test account
aptos account fund-with-faucet --profile local --account local
```

### 4. Compile Move Package
```bash
# Navigate to move directory
cd move

# Compile the package
aptos move compile --profile local

# Run tests
aptos move test --profile local
```

### 5. Deploy Package
```bash
# Deploy the package
aptos move publish --profile local
```

### 6. Initialize Registry
```bash
# Initialize the stealth address registry
aptos move run --profile local \
    --function-id furtim::stealth_address::initialize
```

## Contract Functions

### Core Functions

#### 1. Register Stealth Address
```bash
aptos move run --profile local \
    --function-id furtim::stealth_address::register_stealth_address \
    --args hex:"<scan_public_key>" hex:"<spend_public_key>"
```

#### 2. Create Stealth Payment
```bash
aptos move run --profile local \
    --function-id furtim::stealth_address::create_stealth_payment \
    --args address:"<stealth_address>" hex:"<ephemeral_public_key>" u64:<amount> string:"<coin_type>" hex:"<tx_hash>"
```

#### 3. Claim Stealth Payment
```bash
aptos move run --profile local \
    --function-id furtim::stealth_address::claim_stealth_payment \
    --args u64:<payment_id> address:"<stealth_address>" hex:"<ephemeral_public_key>" hex:"<shared_secret_proof>"
```

#### 4. Get Stealth Address Info
```bash
aptos move view --profile local \
    --function-id furtim::stealth_address::get_stealth_address_info \
    --args address:"<stealth_address>"
```

#### 5. Deactivate/Reactivate Stealth Address
```bash
# Deactivate
aptos move run --profile local \
    --function-id furtim::stealth_address::deactivate_stealth_address

# Reactivate
aptos move run --profile local \
    --function-id furtim::stealth_address::reactivate_stealth_address
```

## Testing

### Run All Tests
```bash
./scripts/test-contracts.sh
```

### Individual Test Commands
```bash
# Test stealth address registration
aptos move run --profile local \
    --function-id furtim::stealth_address::register_stealth_address \
    --args hex:"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" \
    hex:"0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"

# Test stealth payment creation
aptos move run --profile local \
    --function-id furtim::stealth_address::create_stealth_payment \
    --args address:"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" \
    hex:"0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890" \
    u64:100 string:"USDC" hex:"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"

# Test stealth payment claiming
aptos move run --profile local \
    --function-id furtim::stealth_address::claim_stealth_payment \
    --args u64:1 address:"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" \
    hex:"0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890" \
    hex:"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
```

## Troubleshooting

### Common Issues

#### 1. Docker Not Running
```bash
# Start Docker Desktop
# Or start Docker service
sudo systemctl start docker
```

#### 2. Aptos CLI Not Found
```bash
# Reinstall Aptos CLI
curl -fsSL https://aptos.dev/scripts/install_cli.py | python3
```

#### 3. Local Node Not Starting
```bash
# Check if port 8080 is available
netstat -tulpn | grep :8080

# Kill any existing processes
pkill -f "aptos node run-local-testnet"
```

#### 4. Compilation Errors
```bash
# Clean and recompile
cd move
rm -rf build/
aptos move compile --profile local
```

#### 5. Deployment Errors
```bash
# Check account balance
aptos account list --profile local

# Fund account if needed
aptos account fund-with-faucet --profile local --account local
```

### Debug Commands

#### Check Node Status
```bash
curl http://localhost:8080/v1
```

#### Check Account Balance
```bash
aptos account list --profile local
```

#### View Transaction History
```bash
aptos account list --profile local --query transactions
```

#### Check Module Status
```bash
aptos account list --profile local --query modules
```

## Integration with Backend

### 1. Update Backend Configuration
```typescript
// In your backend config
const APTOS_NETWORK = 'local';
const APTOS_NODE_URL = 'http://localhost:8080';
const APTOS_FAUCET_URL = 'http://localhost:8081';
```

### 2. Start Backend Indexer
```bash
# Start the backend indexer
npm run dev

# The indexer will monitor the local node for stealth transactions
```

### 3. Test End-to-End Flow
```bash
# 1. Deploy contracts (done above)
# 2. Start backend indexer
# 3. Start frontend
# 4. Test stealth payment flow
```

## Next Steps

### 1. Deploy to Testnet
```bash
# Switch to testnet
aptos init --profile testnet --network testnet

# Deploy to testnet
aptos move publish --profile testnet
```

### 2. Deploy to Mainnet
```bash
# Switch to mainnet
aptos init --profile mainnet --network mainnet

# Deploy to mainnet (production)
aptos move publish --profile mainnet
```

### 3. Monitor Production
```bash
# Use the monitoring service
npm run monitor

# Check system health
curl http://localhost:3001/api/stealth/indexer/status
```

## Support

If you encounter issues:

1. Check the logs: `tail -f .aptos/logs/*.log`
2. Verify Docker is running: `docker ps`
3. Check node status: `curl http://localhost:8080/v1`
4. Review Aptos documentation: https://aptos.dev/

## Security Notes

- **Never use real private keys in local development**
- **Test thoroughly before deploying to mainnet**
- **Use proper key management in production**
- **Monitor for security vulnerabilities**
