# 📍 Furtim Deployment Address Guide

This guide explains how to get and manage deployment addresses for your Furtim stealth address contracts.

## 🎯 **What is a Deployment Address?**

The **deployment address** is your Aptos account address where the contracts are deployed. It's like your "contract wallet" on the blockchain.

### **How to Get Your Deployment Address:**

#### **Method 1: Automatic (Recommended)**
The deployment scripts automatically retrieve and display your deployment address:

```powershell
# Deploy to testnet (shows address automatically)
.\scripts\deploy-testnet-simple.ps1

# Deploy to devnet (shows address automatically)  
.\scripts\deploy-devnet-simple.ps1
```

#### **Method 2: Manual Retrieval**
```powershell
# Get address for testnet
aptos account list --profile testnet --query modules

# Get address for devnet
aptos account list --profile devnet --query modules
```

#### **Method 3: Check All Deployments**
```powershell
# View all your deployments
.\scripts\get-deployment-address.ps1

# View deployment addresses file
.\scripts\view-deployments.ps1
```

## 🚀 **Step-by-Step Deployment Process**

### **1. Deploy to Testnet (Recommended for testing)**

```powershell
# Step 1: Initialize testnet profile (one-time)
aptos init --profile testnet --network testnet

# Step 2: Deploy contracts
.\scripts\deploy-testnet-simple.ps1
```

**What happens:**
1. ✅ Creates testnet profile
2. ✅ Funds account from faucet
3. ✅ Gets your deployment address
4. ✅ Updates Move.toml with your address
5. ✅ Compiles contracts
6. ✅ Deploys to testnet
7. ✅ Initializes stealth address registry
8. ✅ Shows deployment summary with address

### **2. Deploy to Devnet (Alternative testing)**

```powershell
# Step 1: Initialize devnet profile (one-time)
aptos init --profile devnet --network devnet

# Step 2: Deploy contracts
.\scripts\deploy-devnet-simple.ps1
```

## 📋 **Deployment Address Examples**

### **Testnet Deployment Address:**
```
DEPLOYMENT ADDRESS: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

### **Contract Functions (using your address):**
```
Initialize: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef::stealth_address::initialize
Register: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef::stealth_address::register_stealth_address
Create Payment: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef::stealth_address::create_stealth_payment
Claim Payment: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef::stealth_address::claim_stealth_payment
Deactivate: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef::stealth_address::deactivate_stealth_address
Reactivate: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef::stealth_address::reactivate_stealth_address
```

## 🔧 **Managing Deployment Addresses**

### **View All Deployments:**
```powershell
# See all your deployments
.\scripts\view-deployments.ps1

# Check specific network
.\scripts\get-deployment-address.ps1
```

### **Update Deployment Address:**
```powershell
# Update testnet address
.\scripts\update-deployment-address.ps1 -Network testnet -Address "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"

# Update devnet address  
.\scripts\update-deployment-address.ps1 -Network devnet -Address "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
```

## 🌐 **Network Information**

### **Testnet:**
- **Network**: Aptos Testnet
- **RPC URL**: https://fullnode.testnet.aptoslabs.com/v1
- **Explorer**: https://explorer.aptoslabs.com/?network=testnet
- **Faucet**: https://faucet.testnet.aptoslabs.com/

### **Devnet:**
- **Network**: Aptos Devnet  
- **RPC URL**: https://fullnode.devnet.aptoslabs.com/v1
- **Explorer**: https://explorer.aptoslabs.com/?network=devnet
- **Faucet**: https://faucet.devnet.aptoslabs.com/

## 🔗 **Backend Configuration**

### **Update Your Backend with Deployment Address:**

```typescript
// In your backend configuration
const APTOS_CONFIG = {
  testnet: {
    network: 'testnet',
    rpcUrl: 'https://fullnode.testnet.aptoslabs.com/v1',
    deploymentAddress: 'YOUR_DEPLOYMENT_ADDRESS_HERE', // Get from deployment
    contractFunctions: {
      initialize: 'YOUR_DEPLOYMENT_ADDRESS_HERE::stealth_address::initialize',
      registerStealthAddress: 'YOUR_DEPLOYMENT_ADDRESS_HERE::stealth_address::register_stealth_address',
      createStealthPayment: 'YOUR_DEPLOYMENT_ADDRESS_HERE::stealth_address::create_stealth_payment',
      claimStealthPayment: 'YOUR_DEPLOYMENT_ADDRESS_HERE::stealth_address::claim_stealth_payment',
      deactivateStealthAddress: 'YOUR_DEPLOYMENT_ADDRESS_HERE::stealth_address::deactivate_stealth_address',
      reactivateStealthAddress: 'YOUR_DEPLOYMENT_ADDRESS_HERE::stealth_address::reactivate_stealth_address'
    }
  }
};
```

## 🧪 **Testing Your Deployment**

### **Test on Testnet:**
```powershell
# Test all functions
.\scripts\test-testnet.ps1

# Test specific function
aptos move run --profile testnet --function-id "YOUR_ADDRESS::stealth_address::register_stealth_address" --args "hex:0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" "hex:0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
```

### **Test on Devnet:**
```powershell
# Test all functions
.\scripts\test-devnet.ps1
```

## 📊 **Deployment Tracking**

### **deployment-addresses.json:**
This file tracks all your deployments:

```json
{
  "deployments": {
    "testnet": {
      "address": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "network": "testnet",
      "rpc_url": "https://fullnode.testnet.aptoslabs.com/v1",
      "explorer_url": "https://explorer.aptoslabs.com/?network=testnet",
      "status": "deployed"
    }
  }
}
```

## 🚨 **Important Notes**

### **Security:**
- ✅ **Never share your private keys**
- ✅ **Use testnet/devnet for testing**
- ✅ **Only use mainnet for production**
- ✅ **Keep deployment addresses secure**

### **Address Format:**
- ✅ **Always starts with `0x`**
- ✅ **64 characters long**
- ✅ **Hexadecimal format**
- ✅ **Example**: `0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`

## 🔍 **Troubleshooting**

### **No Deployment Found:**
```powershell
# Check if profiles exist
aptos account list

# Initialize profile if needed
aptos init --profile testnet --network testnet
```

### **Address Not Found:**
```powershell
# Check account status
aptos account list --profile testnet

# Fund account if needed
aptos account fund-with-faucet --profile testnet --account testnet
```

### **Deployment Failed:**
```powershell
# Check account balance
aptos account list --profile testnet

# Fund account
aptos account fund-with-faucet --profile testnet --account testnet

# Try deployment again
.\scripts\deploy-testnet-simple.ps1
```

## 📚 **Quick Reference**

### **Deploy Commands:**
```powershell
# Testnet deployment
.\scripts\deploy-testnet-simple.ps1

# Devnet deployment  
.\scripts\deploy-devnet-simple.ps1
```

### **Check Commands:**
```powershell
# View all deployments
.\scripts\view-deployments.ps1

# Get deployment address
.\scripts\get-deployment-address.ps1
```

### **Test Commands:**
```powershell
# Test testnet
.\scripts\test-testnet.ps1

# Test devnet
.\scripts\test-devnet.ps1
```

## 🎯 **Next Steps After Deployment**

1. **✅ Save your deployment address**
2. **✅ Update backend configuration**
3. **✅ Test the contracts**
4. **✅ Deploy to mainnet for production**

Your deployment address is your gateway to the stealth address system! 🚀
