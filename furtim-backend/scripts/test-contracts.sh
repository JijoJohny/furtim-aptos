#!/bin/bash

# Test the deployed Furtim contracts
# This script tests the stealth address functionality on the local node

set -e

echo "🧪 Testing Furtim stealth address contracts..."

# Check if we're in the right directory
if [ ! -f "move/Aptos.toml" ]; then
    echo "❌ Please run this script from the furtim-backend directory"
    exit 1
fi

# Test 1: Check if contracts are deployed
echo "📋 Test 1: Checking contract deployment..."
aptos account list --profile local

# Test 2: Test stealth address registration
echo "📋 Test 2: Testing stealth address registration..."
cd move

# Generate test meta keys (simplified for testing)
SCAN_PUBLIC_KEY="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
SPEND_PUBLIC_KEY="0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"

# Register a test stealth address
aptos move run --profile local \
    --function-id furtim::stealth_address::register_stealth_address \
    --args hex:"$SCAN_PUBLIC_KEY" hex:"$SPEND_PUBLIC_KEY"

echo "✅ Stealth address registered successfully!"

# Test 3: Test stealth payment creation
echo "📋 Test 3: Testing stealth payment creation..."
STEALTH_ADDRESS="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
EPHEMERAL_PUBLIC_KEY="0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
AMOUNT=100
COIN_TYPE="USDC"
TX_HASH="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"

aptos move run --profile local \
    --function-id furtim::stealth_address::create_stealth_payment \
    --args address:"$STEALTH_ADDRESS" hex:"$EPHEMERAL_PUBLIC_KEY" u64:$AMOUNT string:"$COIN_TYPE" hex:"$TX_HASH"

echo "✅ Stealth payment created successfully!"

# Test 4: Test stealth payment claiming
echo "📋 Test 4: Testing stealth payment claiming..."
PAYMENT_ID=1
SHARED_SECRET_PROOF="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"

aptos move run --profile local \
    --function-id furtim::stealth_address::claim_stealth_payment \
    --args u64:$PAYMENT_ID address:"$STEALTH_ADDRESS" hex:"$EPHEMERAL_PUBLIC_KEY" hex:"$SHARED_SECRET_PROOF"

echo "✅ Stealth payment claimed successfully!"

# Test 5: Test stealth address info retrieval
echo "📋 Test 5: Testing stealth address info retrieval..."
aptos move view --profile local \
    --function-id furtim::stealth_address::get_stealth_address_info \
    --args address:"$STEALTH_ADDRESS"

echo "✅ Stealth address info retrieved successfully!"

# Test 6: Test stealth address deactivation
echo "📋 Test 6: Testing stealth address deactivation..."
aptos move run --profile local \
    --function-id furtim::stealth_address::deactivate_stealth_address

echo "✅ Stealth address deactivated successfully!"

# Test 7: Test stealth address reactivation
echo "📋 Test 7: Testing stealth address reactivation..."
aptos move run --profile local \
    --function-id furtim::stealth_address::reactivate_stealth_address

echo "✅ Stealth address reactivated successfully!"

echo ""
echo "🎉 All stealth address contract tests passed!"
echo ""
echo "📊 Test Summary:"
echo "   ✅ Contract deployment verified"
echo "   ✅ Stealth address registration working"
echo "   ✅ Stealth payment creation working"
echo "   ✅ Stealth payment claiming working"
echo "   ✅ Stealth address info retrieval working"
echo "   ✅ Stealth address deactivation working"
echo "   ✅ Stealth address reactivation working"
echo ""
echo "🚀 Your stealth address system is ready for integration!"
