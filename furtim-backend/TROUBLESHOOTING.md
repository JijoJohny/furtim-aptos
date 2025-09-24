# 🔧 Furtim Deployment Troubleshooting Guide

This guide helps you resolve common issues when deploying Furtim stealth address contracts locally.

## 🚨 Common Issues & Solutions

### 1. Aptos CLI Version Compatibility

**Problem**: `--profile` flag not supported
```
error: unexpected argument '--profile' found
```

**Solution**: Use the fixed deployment scripts
```powershell
# Use the fixed scripts instead
.\scripts\deploy-local-fixed.ps1
.\scripts\test-contracts-fixed.ps1
```

### 2. Missing AptosFramework Dependency

**Problem**: Unable to resolve AptosFramework
```
Unable to find package manifest for 'AptosFramework'
```

**Solution**: Updated Aptos.toml with correct dependencies
```toml
[dependencies]
AptosFramework = { git = "https://github.com/aptos-labs/aptos-core.git", subdir = "aptos-move/framework/aptos-framework", rev = "aptos-release-v1.8" }
```

### 3. Function ID Format Issues

**Problem**: Invalid function ID format
```
Invalid arguments: Profile furtim not found
```

**Solution**: Use correct function ID format
```powershell
# Wrong format
aptos move run --function-id furtim::stealth_address::initialize

# Correct format
aptos move run --function-id 0x1::stealth_address::initialize
```

### 4. Docker Not Running

**Problem**: Local node fails to start
```
Failed to start local node. Please check Docker and try again.
```

**Solution**: Start Docker Desktop
```powershell
# Check if Docker is running
docker --version

# Start Docker Desktop if not running
# Or restart Docker service
```

### 5. Port Conflicts

**Problem**: Port 8080 already in use
```
Error: Port 8080 is already in use
```

**Solution**: Kill existing processes
```powershell
# Find processes using port 8080
netstat -ano | findstr :8080

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or kill all Aptos processes
Get-Process | Where-Object {$_.ProcessName -like "*aptos*"} | Stop-Process -Force
```

### 6. Compilation Errors

**Problem**: Move compilation fails
```
Error: Compilation failed
```

**Solution**: Clean and recompile
```powershell
# Navigate to move directory
cd move

# Clean build artifacts
Remove-Item -Recurse -Force build\ -ErrorAction SilentlyContinue

# Recompile
aptos move compile
```

### 7. Account Funding Issues

**Problem**: Account has no funds
```
Error: Insufficient funds
```

**Solution**: Fund the account
```powershell
# Fund the account
aptos account fund-with-faucet --profile local --account local

# Check balance
aptos account list --profile local
```

## 🔍 Debug Commands

### Check System Status
```powershell
# Check Aptos CLI version
aptos --version

# Check Docker status
docker --version
docker ps

# Check node status
Invoke-RestMethod -Uri "http://localhost:8080/v1" -Method Get
```

### Check Account Status
```powershell
# List accounts
aptos account list --profile local

# Check account balance
aptos account list --profile local --query balance

# View transaction history
aptos account list --profile local --query transactions
```

### Check Module Status
```powershell
# List deployed modules
aptos account list --profile local --query modules

# View module details
aptos move view --function-id 0x1::stealth_address::get_stealth_address_info
```

## 🛠️ Step-by-Step Recovery

### If Deployment Fails Completely

1. **Clean Everything**
```powershell
# Stop all Aptos processes
Get-Process | Where-Object {$_.ProcessName -like "*aptos*"} | Stop-Process -Force

# Remove .aptos directory
Remove-Item -Recurse -Force .aptos -ErrorAction SilentlyContinue

# Remove move build artifacts
cd move
Remove-Item -Recurse -Force build\ -ErrorAction SilentlyContinue
cd ..
```

2. **Restart Docker**
```powershell
# Restart Docker Desktop
# Or restart Docker service
```

3. **Reinitialize**
```powershell
# Reinitialize Aptos
aptos init --profile local --network local

# Start local node
aptos node run-local-testnet --with-faucet
```

4. **Redeploy**
```powershell
# Use fixed deployment script
.\scripts\deploy-local-fixed.ps1
```

### If Tests Fail

1. **Check Function IDs**
```powershell
# Verify function exists
aptos move view --function-id 0x1::stealth_address::get_stealth_address_info
```

2. **Check Arguments**
```powershell
# Test with simple arguments
aptos move run --function-id 0x1::stealth_address::register_stealth_address --args "hex:0x1234" "hex:0x5678"
```

3. **Check Account Permissions**
```powershell
# Verify account has permissions
aptos account list --profile local
```

## 📋 Pre-Deployment Checklist

Before running deployment scripts:

- [ ] Docker Desktop is running
- [ ] Aptos CLI is installed and in PATH
- [ ] No processes using port 8080
- [ ] .aptos directory is clean
- [ ] move/build directory is clean
- [ ] Network connection is stable

## 🆘 Getting Help

If you're still having issues:

1. **Check Logs**
```powershell
# View Aptos logs
Get-Content .aptos\logs\*.log
```

2. **Verify Environment**
```powershell
# Check all prerequisites
aptos --version
docker --version
node --version
```

3. **Test Basic Commands**
```powershell
# Test basic Aptos functionality
aptos account list --profile local
aptos move compile
```

4. **Check Documentation**
- [Aptos CLI Reference](https://aptos.dev/cli/)
- [Move Language Guide](https://move-language.github.io/move/)
- [Docker Desktop Docs](https://docs.docker.com/desktop/)

## 🔄 Alternative Deployment Methods

### Method 1: Manual Commands
```powershell
# Initialize
aptos init --profile local --network local

# Start node
aptos node run-local-testnet --with-faucet

# Fund account
aptos account fund-with-faucet --profile local --account local

# Compile
cd move
aptos move compile

# Deploy
aptos move publish

# Initialize
aptos move run --function-id 0x1::stealth_address::initialize
```

### Method 2: Using Docker Directly
```powershell
# Run Aptos node in Docker
docker run -p 8080:8080 -p 8081:8081 aptoslabs/validator:latest
```

### Method 3: Using Aptos Studio
- Use Aptos Studio for visual deployment
- Import the move directory
- Deploy through the UI

## 📊 Success Indicators

Your deployment is successful when you see:

- ✅ Local node running on port 8080
- ✅ Account funded with test tokens
- ✅ Move package compiled successfully
- ✅ Package deployed to local node
- ✅ Stealth address registry initialized
- ✅ All test functions working

## 🚀 Next Steps After Successful Deployment

1. **Start Backend Indexer**
```powershell
npm run dev
```

2. **Test Frontend Integration**
```powershell
cd ../furtim-ui
npm start
```

3. **Verify End-to-End Flow**
- Create stealth address
- Send stealth payment
- Claim stealth payment
- Check transaction history

4. **Deploy to Testnet**
```powershell
aptos init --profile testnet --network testnet
aptos move publish --profile testnet
```
