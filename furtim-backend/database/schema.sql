-- Furtim Database Schema for Supabase
-- This file contains all the SQL commands needed to set up the database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  wallet_address VARCHAR(100) UNIQUE NOT NULL,
  pin_hash VARCHAR(255) NOT NULL,
  public_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create user_meta_keys table for stealth address functionality
CREATE TABLE IF NOT EXISTS user_meta_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  scan_public_key TEXT NOT NULL, -- X25519 public key for ECDH
  spend_public_key TEXT NOT NULL, -- Ed25519 public key for signing
  meta_keys_encrypted TEXT NOT NULL, -- Encrypted private keys (never stored in plain text)
  encryption_salt VARCHAR(255) NOT NULL, -- Salt for key encryption
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  wallet_signature TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_links table
CREATE TABLE IF NOT EXISTS payment_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  link_type VARCHAR(20) NOT NULL CHECK (link_type IN ('simple', 'download')),
  amount_type VARCHAR(10) NOT NULL CHECK (amount_type IN ('fixed', 'open')),
  fixed_amount DECIMAL(18,6),
  description TEXT,
  stealth_address VARCHAR(100),
  public_url VARCHAR(200) NOT NULL,
  qr_code_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  total_views INTEGER DEFAULT 0,
  total_payments INTEGER DEFAULT 0
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_link_id UUID REFERENCES payment_links(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stealth_address VARCHAR(100) NOT NULL,
  sender_address VARCHAR(100) NOT NULL,
  amount DECIMAL(18,6) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USDC',
  transaction_hash VARCHAR(100) UNIQUE NOT NULL,
  block_number BIGINT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('incoming', 'outgoing')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  gas_fee DECIMAL(18,6),
  metadata JSONB
);

-- Create stealth_addresses table
CREATE TABLE IF NOT EXISTS stealth_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  payment_link_id UUID REFERENCES payment_links(id) ON DELETE CASCADE,
  stealth_address VARCHAR(100) UNIQUE NOT NULL,
  view_key TEXT NOT NULL,
  spend_key TEXT NOT NULL,
  public_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE
);

-- Create link_analytics table
CREATE TABLE IF NOT EXISTS link_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_link_id UUID REFERENCES payment_links(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  referrer VARCHAR(500),
  country VARCHAR(2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  notifications JSONB DEFAULT '{}',
  privacy_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stealth_balances table
CREATE TABLE IF NOT EXISTS stealth_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stealth_address VARCHAR(100) NOT NULL,
  balance DECIMAL(18,6) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USDC',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_links_user_id ON payment_links(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_slug ON payment_links(slug);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_link_id ON transactions(payment_link_id);
CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_stealth_addresses_user_id ON stealth_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_stealth_addresses_address ON stealth_addresses(stealth_address);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_links_updated_at BEFORE UPDATE ON payment_links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stealth_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stealth_balances ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- User sessions policies
CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Payment links policies
CREATE POLICY "Users can view own payment links" ON payment_links
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment links" ON payment_links
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment links" ON payment_links
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment links" ON payment_links
    FOR DELETE USING (auth.uid() = user_id);

-- Public access to payment links for payment processing
CREATE POLICY "Public can view active payment links" ON payment_links
    FOR SELECT USING (is_active = true);

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User meta keys policies
CREATE POLICY "Users can view own meta keys" ON user_meta_keys
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meta keys" ON user_meta_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meta keys" ON user_meta_keys
    FOR UPDATE USING (auth.uid() = user_id);

-- Stealth addresses policies
CREATE POLICY "Users can view own stealth addresses" ON stealth_addresses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stealth addresses" ON stealth_addresses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Analytics policies
CREATE POLICY "Users can view own analytics" ON link_analytics
    FOR SELECT USING (
        payment_link_id IN (
            SELECT id FROM payment_links WHERE user_id = auth.uid()
        )
    );

-- User settings policies
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Stealth balances policies
CREATE POLICY "Users can view own balances" ON stealth_balances
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own balances" ON stealth_balances
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own balances" ON stealth_balances
    FOR UPDATE USING (auth.uid() = user_id);
