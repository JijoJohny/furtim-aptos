#!/bin/bash

# Deploy Furtim Move contracts locally using Aptos CLI
# This script sets up a local Aptos node and deploys the stealth address contracts

set -e

echo "🚀 Starting Furtim Move contract deployment to local Aptos node..."

# Check if aptos CLI is installed
if ! command -v aptos &> /dev/null; then
    echo "❌ Aptos CLI not found. Please install it first:"
    echo "   curl -fsSL https://aptos.dev/scripts/install_cli.py | python3"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "move/Aptos.toml" ]; then
    echo "❌ Please run this script from the furtim-backend directory"
    exit 1
fi

# Create local test account if it doesn't exist
echo "📋 Setting up local test account..."
if [ ! -f ".aptos/config.yaml" ]; then
    aptos init --profile local
fi

# Fund the account with test tokens
echo "💰 Funding test account..."
aptos account fund-with-faucet --profile local --account local

# Check account balance
echo "📊 Account balance:"
aptos account list --profile local

# Compile the Move package
echo "🔨 Compiling Move package..."
cd move
aptos move compile --profile local

# Test the compilation
echo "🧪 Running Move tests..."
aptos move test --profile local

# Deploy the package
echo "📦 Deploying package to local node..."
aptos move publish --profile local

# Initialize the stealth address registry
echo "🔧 Initializing stealth address registry..."
aptos move run --profile local \
    --function-id furtim::stealth_address::initialize

# Verify deployment
echo "✅ Verifying deployment..."
aptos account list --profile local

echo "🎉 Furtim stealth address contracts deployed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "   - Network: Local Aptos node"
echo "   - Account: local"
echo "   - Package: furtim"
echo "   - Module: stealth_address"
echo ""
echo "🔗 Next steps:"
echo "   1. Start your backend indexer"
echo "   2. Test the stealth address functionality"
echo "   3. Deploy to testnet when ready"
