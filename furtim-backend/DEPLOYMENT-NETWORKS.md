# 🌐 Furtim Stealth Address Contracts - Network Deployment Guide

This guide will help you deploy the Furtim stealth address contracts to Aptos Devnet and Testnet.

## 📋 Prerequisites

### 1. Install Aptos CLI
```powershell
# Install Aptos CLI
curl -fsSL https://aptos.dev/scripts/install_cli.py | python3

# Verify installation
aptos --version
```

### 2. Install Node.js (for backend)
```powershell
# Install Node.js 18+ from https://nodejs.org/
node --version
npm --version
```

## 🚀 Quick Start Deployment

### Step 1: Deploy to Devnet
```powershell
# Navigate to the backend directory
cd furtim-backend

# Deploy to devnet
.\scripts\deploy-devnet.ps1
```

### Step 2: Test Devnet Deployment
```powershell
# Test the deployed contracts on devnet
.\scripts\test-devnet.ps1
```

### Step 3: Deploy to Testnet
```powershell
# Deploy to testnet
.\scripts\deploy-testnet.ps1
```

### Step 4: Test Testnet Deployment
```powershell
# Test the deployed contracts on testnet
.\scripts\test-testnet.ps1
```

## 🔧 Manual Deployment Steps

### Devnet Deployment

#### 1. Initialize Devnet Configuration
```powershell
# Initialize Aptos for devnet
aptos init --profile devnet --network devnet
```

#### 2. Fund Account
```powershell
# Fund your account from devnet faucet
aptos account fund-with-faucet --profile devnet --account devnet
```

#### 3. Update Move.toml
```powershell
# Get your account address
$accountInfo = aptos account list --profile devnet --query modules
$accountAddress = ($accountInfo | ConvertFrom-Json).Result[0].address

# Update Move.toml with your address
# Edit move/Move.toml and set:
# furtim = "YOUR_ACCOUNT_ADDRESS"
```

#### 4. Deploy Package
```powershell
# Navigate to move directory
cd move

# Compile and deploy
aptos move compile
aptos move test
aptos move publish --profile devnet
```

#### 5. Initialize Registry
```powershell
# Initialize the stealth address registry
aptos move run --profile devnet --function-id "YOUR_ACCOUNT_ADDRESS::stealth_address::initialize"
```

### Testnet Deployment

#### 1. Initialize Testnet Configuration
```powershell
# Initialize Aptos for testnet
aptos init --profile testnet --network testnet
```

#### 2. Fund Account
```powershell
# Fund your account from testnet faucet
aptos account fund-with-faucet --profile testnet --account testnet
```

#### 3. Update Move.toml
```powershell
# Get your account address
$accountInfo = aptos account list --profile testnet --query modules
$accountAddress = ($accountInfo | ConvertFrom-Json).Result[0].address

# Update Move.toml with your address
# Edit move/Move.toml and set:
# furtim = "YOUR_ACCOUNT_ADDRESS"
```

#### 4. Deploy Package
```powershell
# Navigate to move directory
cd move

# Compile and deploy
aptos move compile
aptos move test
aptos move publish --profile testnet
```

#### 5. Initialize Registry
```powershell
# Initialize the stealth address registry
aptos move run --profile testnet --function-id "YOUR_ACCOUNT_ADDRESS::stealth_address::initialize"
```

## 🧪 Testing Deployments

### Test Devnet
```powershell
# Test all functions on devnet
.\scripts\test-devnet.ps1
```

### Test Testnet
```powershell
# Test all functions on testnet
.\scripts\test-testnet.ps1
```

### Individual Test Commands

#### Devnet Testing
```powershell
# Test stealth address registration
aptos move run --profile devnet --function-id "YOUR_ADDRESS::stealth_address::register_stealth_address" --args "hex:0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" "hex:0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"

# Test stealth payment creation
aptos move run --profile devnet --function-id "YOUR_ADDRESS::stealth_address::create_stealth_payment" --args "address:0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" "hex:0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890" "u64:100" "string:USDC" "hex:0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
```

#### Testnet Testing
```powershell
# Test stealth address registration
aptos move run --profile testnet --function-id "YOUR_ADDRESS::stealth_address::register_stealth_address" --args "hex:0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" "hex:0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"

# Test stealth payment creation
aptos move run --profile testnet --function-id "YOUR_ADDRESS::stealth_address::create_stealth_payment" --args "address:0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" "hex:0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890" "u64:100" "string:USDC" "hex:0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
```

## 🔗 Network Information

### Devnet
- **Network**: Aptos Devnet
- **Explorer**: https://explorer.aptoslabs.com/?network=devnet
- **Faucet**: https://faucet.devnet.aptoslabs.com/
- **RPC**: https://fullnode.devnet.aptoslabs.com/v1

### Testnet
- **Network**: Aptos Testnet
- **Explorer**: https://explorer.aptoslabs.com/?network=testnet
- **Faucet**: https://faucet.testnet.aptoslabs.com/
- **RPC**: https://fullnode.testnet.aptoslabs.com/v1

## 🔧 Backend Configuration

### Update Backend for Different Networks

#### Devnet Configuration
```typescript
// In your backend config
const APTOS_NETWORK = 'devnet';
const APTOS_NODE_URL = 'https://fullnode.devnet.aptoslabs.com/v1';
const APTOS_FAUCET_URL = 'https://faucet.devnet.aptoslabs.com/';
```

#### Testnet Configuration
```typescript
// In your backend config
const APTOS_NETWORK = 'testnet';
const APTOS_NODE_URL = 'https://fullnode.testnet.aptoslabs.com/v1';
const APTOS_FAUCET_URL = 'https://faucet.testnet.aptoslabs.com/';
```

## 🚀 Production Deployment

### Deploy to Mainnet
```powershell
# Initialize mainnet configuration
aptos init --profile mainnet --network mainnet

# Deploy to mainnet (production)
aptos move publish --profile mainnet

# Initialize registry
aptos move run --profile mainnet --function-id "YOUR_ADDRESS::stealth_address::initialize"
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Account Not Funded
```powershell
# Fund account from faucet
aptos account fund-with-faucet --profile devnet --account devnet
aptos account fund-with-faucet --profile testnet --account testnet
```

#### 2. Move.toml Address Mismatch
```powershell
# Get correct account address
aptos account list --profile devnet
aptos account list --profile testnet

# Update Move.toml with correct address
```

#### 3. Compilation Errors
```powershell
# Clean and recompile
cd move
Remove-Item -Recurse -Force build\ -ErrorAction SilentlyContinue
aptos move compile
```

#### 4. Deployment Errors
```powershell
# Check account balance
aptos account list --profile devnet
aptos account list --profile testnet

# Fund if needed
aptos account fund-with-faucet --profile devnet --account devnet
aptos account fund-with-faucet --profile testnet --account testnet
```

### Debug Commands

#### Check Network Status
```powershell
# Check devnet status
curl https://fullnode.devnet.aptoslabs.com/v1

# Check testnet status
curl https://fullnode.testnet.aptoslabs.com/v1
```

#### Check Account Status
```powershell
# Check devnet account
aptos account list --profile devnet

# Check testnet account
aptos account list --profile testnet
```

## 📊 Deployment Checklist

### Devnet Deployment
- [ ] Initialize devnet profile
- [ ] Fund account from faucet
- [ ] Update Move.toml with account address
- [ ] Compile Move package
- [ ] Run Move tests
- [ ] Deploy package
- [ ] Initialize stealth address registry
- [ ] Test all functions
- [ ] Verify on explorer

### Testnet Deployment
- [ ] Initialize testnet profile
- [ ] Fund account from faucet
- [ ] Update Move.toml with account address
- [ ] Compile Move package
- [ ] Run Move tests
- [ ] Deploy package
- [ ] Initialize stealth address registry
- [ ] Test all functions
- [ ] Verify on explorer

## 🆘 Support

If you encounter issues:

1. Check the logs: `Get-Content .aptos\logs\*.log`
2. Verify network status: Check explorer links
3. Check account balance: `aptos account list --profile NETWORK`
4. Review Aptos documentation: https://aptos.dev/

## 🔒 Security Notes

- **Never use real private keys in development**
- **Test thoroughly on devnet and testnet before mainnet**
- **Use proper key management in production**
- **Monitor for security vulnerabilities**

## 📚 Additional Resources

- [Aptos Documentation](https://aptos.dev/)
- [Move Language Documentation](https://move-language.github.io/move/)
- [Aptos CLI Reference](https://aptos.dev/cli/)
- [Aptos Explorer](https://explorer.aptoslabs.com/)
