-- Complete Database Schema for Furtim Stealth Address Payment System
-- This file contains all SQL commands needed to set up the complete database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- CORE USER MANAGEMENT TABLES
-- =============================================

-- Create users table with enhanced fields
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  wallet_address VARCHAR(100) UNIQUE NOT NULL,
  pin_hash VARCHAR(255) NOT NULL,
  public_key TEXT,
  email VARCHAR(255),
  phone VARCHAR(20),
  profile_image_url TEXT,
  bio TEXT,
  location VARCHAR(100),
  website VARCHAR(255),
  twitter_handle VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(255),
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP WITH TIME ZONE,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret VARCHAR(255),
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- Create user_meta_keys table for stealth address functionality
CREATE TABLE IF NOT EXISTS user_meta_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  scan_public_key TEXT NOT NULL, -- X25519 public key for ECDH
  spend_public_key TEXT NOT NULL, -- Ed25519 public key for signing
  meta_keys_encrypted TEXT NOT NULL, -- Encrypted private keys (never stored in plain text)
  encryption_salt VARCHAR(255) NOT NULL, -- Salt for key encryption
  key_version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  last_used TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0
);

-- Create user_sessions table with enhanced security
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  refresh_token VARCHAR(255) UNIQUE,
  wallet_signature TEXT,
  ip_address INET,
  user_agent TEXT,
  device_fingerprint VARCHAR(255),
  location_country VARCHAR(2),
  location_city VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  refresh_expires_at TIMESTAMP WITH TIME ZONE,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  session_type VARCHAR(20) DEFAULT 'web' CHECK (session_type IN ('web', 'mobile', 'api')),
  metadata JSONB DEFAULT '{}'
);

-- =============================================
-- PAYMENT LINK MANAGEMENT
-- =============================================

-- Create payment_links table with enhanced features
CREATE TABLE IF NOT EXISTS payment_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  link_type VARCHAR(20) NOT NULL CHECK (link_type IN ('simple', 'download')),
  amount_type VARCHAR(10) NOT NULL CHECK (amount_type IN ('fixed', 'open')),
  fixed_amount DECIMAL(18,6),
  min_amount DECIMAL(18,6),
  max_amount DECIMAL(18,6),
  currency VARCHAR(10) DEFAULT 'APT',
  stealth_address VARCHAR(100),
  public_url VARCHAR(200) NOT NULL,
  qr_code_url VARCHAR(500),
  download_url VARCHAR(500),
  download_filename VARCHAR(255),
  download_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,
  requires_authentication BOOLEAN DEFAULT false,
  allowed_wallets TEXT[], -- Array of allowed wallet addresses
  blocked_wallets TEXT[], -- Array of blocked wallet addresses
  custom_css TEXT,
  custom_js TEXT,
  redirect_url VARCHAR(500),
  success_message TEXT,
  failure_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  total_views INTEGER DEFAULT 0,
  total_payments INTEGER DEFAULT 0,
  total_amount DECIMAL(18,6) DEFAULT 0,
  last_payment_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- =============================================
-- TRANSACTION MANAGEMENT
-- =============================================

-- Create transactions table with comprehensive tracking
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_link_id UUID REFERENCES payment_links(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stealth_address VARCHAR(100) NOT NULL,
  sender_address VARCHAR(100) NOT NULL,
  recipient_address VARCHAR(100),
  amount DECIMAL(18,6) NOT NULL,
  currency VARCHAR(10) DEFAULT 'APT',
  transaction_hash VARCHAR(100) UNIQUE NOT NULL,
  block_number BIGINT,
  block_hash VARCHAR(100),
  gas_used BIGINT,
  gas_price DECIMAL(18,6),
  gas_fee DECIMAL(18,6),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled')),
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('incoming', 'outgoing', 'transfer')),
  network VARCHAR(20) DEFAULT 'testnet' CHECK (network IN ('testnet', 'mainnet', 'devnet')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}',
  tags TEXT[],
  notes TEXT
);

-- =============================================
-- STEALTH ADDRESS SYSTEM
-- =============================================

-- Create stealth_addresses table for generated addresses
CREATE TABLE IF NOT EXISTS stealth_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  payment_link_id UUID REFERENCES payment_links(id) ON DELETE CASCADE,
  stealth_address VARCHAR(100) UNIQUE NOT NULL,
  ephemeral_public_key TEXT,
  shared_secret TEXT,
  view_key TEXT NOT NULL,
  spend_key TEXT NOT NULL,
  public_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- Create stealth_transactions table for stealth payments
CREATE TABLE IF NOT EXISTS stealth_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  payment_id BIGINT NOT NULL,
  stealth_address VARCHAR(100) NOT NULL,
  ephemeral_public_key TEXT,
  shared_secret TEXT,
  amount DECIMAL(18,6) NOT NULL,
  coin_type VARCHAR(20) NOT NULL DEFAULT 'APT',
  tx_hash VARCHAR(100) UNIQUE NOT NULL,
  block_number BIGINT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'claimed', 'failed', 'expired')),
  claimed_by VARCHAR(100),
  claimed_at TIMESTAMP WITH TIME ZONE,
  claim_tx_hash VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- Create stealth_events table for blockchain events
CREATE TABLE IF NOT EXISTS stealth_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(50) NOT NULL,
  payment_id BIGINT NOT NULL,
  stealth_address VARCHAR(100) NOT NULL,
  amount DECIMAL(18,6),
  coin_type VARCHAR(20),
  claimed_by VARCHAR(100),
  tx_hash VARCHAR(100) NOT NULL,
  block_number BIGINT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  is_processed BOOLEAN DEFAULT false
);

-- Create stealth_balances table for user balances
CREATE TABLE IF NOT EXISTS stealth_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stealth_address VARCHAR(100) NOT NULL,
  balance DECIMAL(18,6) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'APT',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  pending_balance DECIMAL(18,6) DEFAULT 0,
  locked_balance DECIMAL(18,6) DEFAULT 0
);

-- =============================================
-- INDEXER AND MONITORING
-- =============================================

-- Create indexer_state table to track indexer progress
CREATE TABLE IF NOT EXISTS indexer_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  indexer_type VARCHAR(50) UNIQUE NOT NULL,
  last_processed_version BIGINT NOT NULL DEFAULT 0,
  last_processed_block BIGINT NOT NULL DEFAULT 0,
  last_processed_timestamp TIMESTAMP WITH TIME ZONE,
  is_running BOOLEAN DEFAULT false,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  last_error_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Create system_logs table for monitoring
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_level VARCHAR(20) NOT NULL CHECK (log_level IN ('debug', 'info', 'warn', 'error', 'fatal')),
  service VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ANALYTICS AND TRACKING
-- =============================================

-- Create link_analytics table for payment link analytics
CREATE TABLE IF NOT EXISTS link_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_link_id UUID REFERENCES payment_links(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  referrer VARCHAR(500),
  country VARCHAR(2),
  city VARCHAR(100),
  device_type VARCHAR(20),
  browser VARCHAR(50),
  os VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Create user_activity table for user behavior tracking
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT,
  ip_address INET,
  user_agent TEXT,
  location_country VARCHAR(2),
  location_city VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- =============================================
-- USER PREFERENCES AND SETTINGS
-- =============================================

-- Create user_settings table for user preferences
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'UTC',
  currency VARCHAR(10) DEFAULT 'USD',
  notifications JSONB DEFAULT '{}',
  privacy_settings JSONB DEFAULT '{}',
  security_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_notifications table for notification management
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  is_important BOOLEAN DEFAULT false,
  action_url VARCHAR(500),
  action_text VARCHAR(100),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- SECURITY AND COMPLIANCE
-- =============================================

-- Create security_events table for security monitoring
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  location_country VARCHAR(2),
  location_city VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  is_resolved BOOLEAN DEFAULT false
);

-- Create api_keys table for API access management
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key_name VARCHAR(100) NOT NULL,
  api_key VARCHAR(255) UNIQUE NOT NULL,
  api_secret VARCHAR(255) NOT NULL,
  permissions TEXT[],
  is_active BOOLEAN DEFAULT true,
  last_used TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- User table indexes
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Session table indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Payment links indexes
CREATE INDEX IF NOT EXISTS idx_payment_links_user_id ON payment_links(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_slug ON payment_links(slug);
CREATE INDEX IF NOT EXISTS idx_payment_links_is_active ON payment_links(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_links_created_at ON payment_links(created_at);

-- Transaction indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_link_id ON transactions(payment_link_id);
CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- Stealth address indexes
CREATE INDEX IF NOT EXISTS idx_stealth_addresses_user_id ON stealth_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_stealth_addresses_address ON stealth_addresses(stealth_address);
CREATE INDEX IF NOT EXISTS idx_stealth_addresses_is_used ON stealth_addresses(is_used);

-- Stealth transaction indexes
CREATE INDEX IF NOT EXISTS idx_stealth_transactions_user_id ON stealth_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_stealth_transactions_stealth_address ON stealth_transactions(stealth_address);
CREATE INDEX IF NOT EXISTS idx_stealth_transactions_status ON stealth_transactions(status);
CREATE INDEX IF NOT EXISTS idx_stealth_transactions_tx_hash ON stealth_transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_stealth_transactions_created_at ON stealth_transactions(created_at);

-- Stealth event indexes
CREATE INDEX IF NOT EXISTS idx_stealth_events_stealth_address ON stealth_events(stealth_address);
CREATE INDEX IF NOT EXISTS idx_stealth_events_event_type ON stealth_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stealth_events_created_at ON stealth_events(created_at);
CREATE INDEX IF NOT EXISTS idx_stealth_events_is_processed ON stealth_events(is_processed);

-- Stealth balance indexes
CREATE INDEX IF NOT EXISTS idx_stealth_balances_user_id ON stealth_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_stealth_balances_stealth_address ON stealth_balances(stealth_address);
CREATE INDEX IF NOT EXISTS idx_stealth_balances_currency ON stealth_balances(currency);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_link_analytics_payment_link_id ON link_analytics(payment_link_id);
CREATE INDEX IF NOT EXISTS idx_link_analytics_event_type ON link_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_link_analytics_created_at ON link_analytics(created_at);

-- System logs indexes
CREATE INDEX IF NOT EXISTS idx_system_logs_log_level ON system_logs(log_level);
CREATE INDEX IF NOT EXISTS idx_system_logs_service ON system_logs(service);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);

-- Security events indexes
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);

-- =============================================
-- TRIGGERS AND FUNCTIONS
-- =============================================

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

CREATE TRIGGER update_stealth_transactions_updated_at BEFORE UPDATE ON stealth_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stealth_balances_updated_at BEFORE UPDATE ON stealth_balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_indexer_state_updated_at BEFORE UPDATE ON indexer_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_meta_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stealth_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE stealth_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stealth_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE stealth_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- User sessions policies
CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- User meta keys policies
CREATE POLICY "Users can view own meta keys" ON user_meta_keys
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meta keys" ON user_meta_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meta keys" ON user_meta_keys
    FOR UPDATE USING (auth.uid() = user_id);

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
    FOR SELECT USING (is_active = true AND is_public = true);

-- Transaction policies
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Stealth address policies
CREATE POLICY "Users can view own stealth addresses" ON stealth_addresses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stealth addresses" ON stealth_addresses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Stealth transaction policies
CREATE POLICY "Users can view own stealth transactions" ON stealth_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stealth transactions" ON stealth_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stealth transactions" ON stealth_transactions
    FOR UPDATE USING (auth.uid() = user_id);

-- Stealth event policies
CREATE POLICY "Users can view own stealth events" ON stealth_events
    FOR SELECT USING (
        stealth_address IN (
            SELECT stealth_address FROM stealth_transactions WHERE user_id = auth.uid()
        )
    );

-- Stealth balance policies
CREATE POLICY "Users can view own stealth balances" ON stealth_balances
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stealth balances" ON stealth_balances
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stealth balances" ON stealth_balances
    FOR UPDATE USING (auth.uid() = user_id);

-- Analytics policies
CREATE POLICY "Users can view own analytics" ON link_analytics
    FOR SELECT USING (
        payment_link_id IN (
            SELECT id FROM payment_links WHERE user_id = auth.uid()
        )
    );

-- User activity policies
CREATE POLICY "Users can view own activity" ON user_activity
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity" ON user_activity
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- User notification policies
CREATE POLICY "Users can view own notifications" ON user_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON user_notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON user_notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- API key policies
CREATE POLICY "Users can view own API keys" ON api_keys
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API keys" ON api_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys" ON api_keys
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys" ON api_keys
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- INITIAL DATA SETUP
-- =============================================

-- Insert initial indexer state
INSERT INTO indexer_state (indexer_type, last_processed_version, last_processed_block) 
VALUES ('stealth_address', 0, 0) 
ON CONFLICT (indexer_type) DO NOTHING;

-- Insert system configuration
INSERT INTO system_logs (log_level, service, message, context)
VALUES ('info', 'database', 'Database schema initialized successfully', '{"version": "1.0.0"}')
ON CONFLICT DO NOTHING;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

-- Log successful schema creation
DO $$
BEGIN
    RAISE NOTICE 'Furtim database schema created successfully!';
    RAISE NOTICE 'All tables, indexes, triggers, and RLS policies have been set up.';
    RAISE NOTICE 'Database is ready for the stealth address payment system.';
END $$;
