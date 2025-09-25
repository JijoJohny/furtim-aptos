# Stealth Address Flow Update

## Overview

Updated the stealth address implementation to follow the correct flow where:
- **Receiver's scan public key** → shared through payment link to derive one-time stealth addresses
- **Sender's ephemeral keypair** → sender generates fresh ephemeral private/public key pair for each payment
- **Ephemeral private key** → kept by sender, not shared
- **Ephemeral public key** → shared on-chain with the payment, so the receiver can discover it

## Changes Made

### 1. Database Schema Update

**File:** `furtim-backend/database/migrate-payment-links-scan-key.sql`

- Added `scan_public_key` column to `payment_links` table
- Removed `ephemeral_public_key` and `shared_secret` columns
- Updated column comments to reflect new flow

### 2. Backend API Changes

**File:** `furtim-backend/src/routes/links.ts`

- Updated `CreateLinkRequest` interface to include `scan_public_key` instead of `ephemeral_public_key` and `shared_secret`
- Modified payment link creation logic to store scan public key
- Updated validation and response handling

### 3. Frontend Service Updates

**File:** `furtim-ui/src/services/linksService.ts`

- Updated `CreateLinkRequest` interface to match backend changes
- Updated `PaymentLinkResponse` interface to include `scan_public_key`

### 4. Frontend Component Updates

**File:** `furtim-ui/src/components/CreateLinkModal.tsx`

- Modified stealth address generation to create scan public key instead of ephemeral keys
- Updated form data structure and UI labels
- Changed generation logic to use user's meta keys for scan public key

**File:** `furtim-ui/src/components/StealthPaymentModal.tsx`

- Updated payment generation to create ephemeral keypair on sender side
- Modified logic to use scan public key from payment link
- Added comments explaining the new flow

### 5. Move Contract Updates

**File:** `furtim-backend/move/StealthAddress.move`

- Added comments to clarify the new flow
- Updated function documentation to explain ephemeral key handling

## New Flow Implementation

### Payment Link Creation (Receiver Side)
1. User creates payment link
2. System generates user's meta keys (scan + spend)
3. **Scan public key** is stored in the payment link
4. Placeholder stealth address is generated (actual addresses derived during payment)

### Payment Creation (Sender Side)
1. Sender accesses payment link
2. Sender generates **fresh ephemeral keypair** for this payment
3. Sender uses receiver's **scan public key** from payment link
4. Sender derives one-time stealth address using ECDH
5. Sender makes payment to derived stealth address
6. **Ephemeral public key** is shared on-chain with the payment

### Payment Discovery (Receiver Side)
1. Receiver scans blockchain for payments with their scan private key
2. Receiver discovers ephemeral public keys from on-chain payments
3. Receiver derives shared secrets and stealth addresses
4. Receiver can claim payments using their spend private key

## Key Benefits

1. **Privacy**: Each payment uses a unique stealth address
2. **Security**: Ephemeral private keys never leave sender's device
3. **Discoverability**: Receivers can discover all their payments using their scan key
4. **Scalability**: No need to pre-generate addresses or store shared secrets

## Migration Notes

- Existing payment links will need to be recreated due to schema changes
- The migration script provides the SQL to update the database schema
- All frontend and backend components have been updated to handle the new flow

## Testing

To test the new flow:
1. Run the database migration script
2. Create a new payment link (should store scan public key)
3. Make a payment using the link (should generate ephemeral keys on sender side)
4. Verify ephemeral public key is shared on-chain with payment
