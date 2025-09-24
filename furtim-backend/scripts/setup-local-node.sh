#!/bin/bash

# Setup local Aptos node for development
# This script starts a local Aptos node and sets up the development environment

set -e

echo "🏗️  Setting up local Aptos development environment..."

# Check if aptos CLI is installed
if ! command -v aptos &> /dev/null; then
    echo "❌ Aptos CLI not found. Please install it first:"
    echo "   curl -fsSL https://aptos.dev/scripts/install_cli.py | python3"
    exit 1
fi

# Check if Docker is running (required for local node)
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create .aptos directory if it doesn't exist
mkdir -p .aptos

# Initialize Aptos configuration
echo "📋 Initializing Aptos configuration..."
aptos init --profile local --network local

# Start local Aptos node
echo "🚀 Starting local Aptos node..."
echo "   This will start a Docker container with a local Aptos node."
echo "   The node will be available at http://localhost:8080"
echo ""

# Start the node in the background
aptos node run-local-testnet --with-faucet &

# Wait for node to start
echo "⏳ Waiting for local node to start..."
sleep 10

# Check if node is running
echo "🔍 Checking node status..."
if curl -s http://localhost:8080/v1 > /dev/null; then
    echo "✅ Local Aptos node is running!"
    echo ""
    echo "📊 Node Information:"
    echo "   - REST API: http://localhost:8080"
    echo "   - Faucet: http://localhost:8081"
    echo "   - Network: local"
    echo ""
    echo "🔑 Test Account:"
    aptos account list --profile local
    echo ""
    echo "💰 Fund your account:"
    echo "   aptos account fund-with-faucet --profile local --account local"
    echo ""
    echo "📦 Deploy contracts:"
    echo "   ./scripts/deploy-local.sh"
else
    echo "❌ Failed to start local node. Please check Docker and try again."
    exit 1
fi
