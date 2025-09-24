-- Additional tables for stealth address indexer functionality

-- Create indexer_state table to track indexer progress
CREATE TABLE IF NOT EXISTS indexer_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  indexer_type VARCHAR(50) UNIQUE NOT NULL,
  last_processed_version BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stealth_transactions table to store stealth payments
CREATE TABLE IF NOT EXISTS stealth_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  payment_id BIGINT NOT NULL,
  stealth_address VARCHAR(100) NOT NULL,
  ephemeral_public_key TEXT,
  amount DECIMAL(18,6) NOT NULL,
  coin_type VARCHAR(20) NOT NULL DEFAULT 'USDC',
  tx_hash VARCHAR(100) UNIQUE NOT NULL,
  block_number BIGINT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'claimed', 'failed')),
  claimed_by VARCHAR(100),
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stealth_events table to store stealth address events
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stealth_balances table to track user stealth balances
CREATE TABLE IF NOT EXISTS stealth_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stealth_address VARCHAR(100) NOT NULL,
  balance DECIMAL(18,6) DEFAULT 0,
  coin_type VARCHAR(20) DEFAULT 'USDC',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stealth_transactions_user_id ON stealth_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_stealth_transactions_stealth_address ON stealth_transactions(stealth_address);
CREATE INDEX IF NOT EXISTS idx_stealth_transactions_status ON stealth_transactions(status);
CREATE INDEX IF NOT EXISTS idx_stealth_transactions_tx_hash ON stealth_transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_stealth_transactions_created_at ON stealth_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_stealth_events_stealth_address ON stealth_events(stealth_address);
CREATE INDEX IF NOT EXISTS idx_stealth_events_event_type ON stealth_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stealth_events_created_at ON stealth_events(created_at);

CREATE INDEX IF NOT EXISTS idx_stealth_balances_user_id ON stealth_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_stealth_balances_stealth_address ON stealth_balances(stealth_address);
CREATE INDEX IF NOT EXISTS idx_stealth_balances_coin_type ON stealth_balances(coin_type);

-- Create updated_at trigger for stealth_transactions
CREATE TRIGGER update_stealth_transactions_updated_at BEFORE UPDATE ON stealth_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create updated_at trigger for stealth_balances
CREATE TRIGGER update_stealth_balances_updated_at BEFORE UPDATE ON stealth_balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE stealth_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stealth_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE stealth_balances ENABLE ROW LEVEL SECURITY;

-- Stealth transactions policies
CREATE POLICY "Users can view own stealth transactions" ON stealth_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stealth transactions" ON stealth_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stealth transactions" ON stealth_transactions
    FOR UPDATE USING (auth.uid() = user_id);

-- Stealth events policies
CREATE POLICY "Users can view own stealth events" ON stealth_events
    FOR SELECT USING (
        stealth_address IN (
            SELECT stealth_address FROM stealth_transactions WHERE user_id = auth.uid()
        )
    );

-- Stealth balances policies
CREATE POLICY "Users can view own stealth balances" ON stealth_balances
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stealth balances" ON stealth_balances
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stealth balances" ON stealth_balances
    FOR UPDATE USING (auth.uid() = user_id);

-- Insert initial indexer state
INSERT INTO indexer_state (indexer_type, last_processed_version) 
VALUES ('stealth_address', 0) 
ON CONFLICT (indexer_type) DO NOTHING;
