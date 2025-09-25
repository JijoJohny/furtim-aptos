-- Migration: Update payment_links table to store scan public key instead of ephemeral public key
-- This changes the stealth address flow so that:
-- 1. Payment links contain the receiver's scan public key
-- 2. Senders generate ephemeral keypairs when making payments
-- 3. Ephemeral public keys are shared on-chain with the payment

-- Add new column for scan public key
ALTER TABLE payment_links 
ADD COLUMN scan_public_key TEXT;

-- Update the comment for the new column
COMMENT ON COLUMN payment_links.scan_public_key IS 'Receiver scan public key used to derive one-time stealth addresses';

-- Update existing records (if any) by migrating ephemeral_public_key to scan_public_key
-- Note: This is a breaking change - existing payment links will need to be recreated
UPDATE payment_links 
SET scan_public_key = ephemeral_public_key 
WHERE ephemeral_public_key IS NOT NULL;

-- Make scan_public_key NOT NULL after migration
ALTER TABLE payment_links 
ALTER COLUMN scan_public_key SET NOT NULL;

-- Drop the old ephemeral_public_key column
ALTER TABLE payment_links 
DROP COLUMN ephemeral_public_key;

-- Drop the shared_secret column as it's no longer needed in payment links
-- (shared secrets are computed dynamically during payment)
ALTER TABLE payment_links 
DROP COLUMN shared_secret;

-- Update comments
COMMENT ON COLUMN payment_links.stealth_address IS 'Placeholder stealth address - actual addresses are derived dynamically during payment';
