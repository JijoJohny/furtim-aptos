#!/bin/bash

# Cleanup local Aptos development environment
# This script stops the local node and cleans up resources

set -e

echo "🧹 Cleaning up local Aptos development environment..."

# Stop any running Aptos processes
echo "🛑 Stopping local Aptos node..."
pkill -f "aptos node run-local-testnet" || true

# Stop Docker containers
echo "🐳 Stopping Docker containers..."
docker stop $(docker ps -q --filter "ancestor=aptoslabs/validator:latest") 2>/dev/null || true

# Clean up Docker resources
echo "🗑️  Cleaning up Docker resources..."
docker system prune -f

# Remove local configuration (optional)
read -p "Do you want to remove local Aptos configuration? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Removing local Aptos configuration..."
    rm -rf .aptos
    echo "✅ Local Aptos configuration removed"
fi

# Remove compiled Move artifacts
echo "🗑️  Cleaning up Move artifacts..."
cd move
rm -rf build/
rm -rf .aptos/
echo "✅ Move artifacts cleaned up"

echo ""
echo "🎉 Local development environment cleaned up successfully!"
echo ""
echo "📋 Cleanup Summary:"
echo "   ✅ Local Aptos node stopped"
echo "   ✅ Docker containers stopped"
echo "   ✅ Docker resources cleaned"
echo "   ✅ Move artifacts cleaned"
echo ""
echo "🔧 To start fresh:"
echo "   ./scripts/setup-local-node.sh"
