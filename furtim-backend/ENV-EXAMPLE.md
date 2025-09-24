# Correct .env.local File for Furtim Backend

## 🔧 **REQUIRED ENVIRONMENT VARIABLES**

Create a `.env.local` file in the `furtim-backend` folder with the following content:

```bash
# =============================================================================
# DATABASE CONFIGURATION (Supabase)
# =============================================================================

# Supabase Project URL
# Get this from your Supabase project dashboard > Settings > API
SUPABASE_URL=https://your-project-id.supabase.co

# Supabase Anon Public Key
# Get this from your Supabase project dashboard > Settings > API
SUPABASE_ANON_KEY=your_anon_public_key_here

# Supabase Service Role Key (for admin operations)
# Get this from your Supabase project dashboard > Settings > API
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# =============================================================================
# APTOS NETWORK CONFIGURATION
# =============================================================================

# Aptos Network (testnet, devnet, mainnet)
APTOS_NETWORK=testnet

# Aptos RPC URL
APTOS_RPC_URL=https://fullnode.testnet.aptoslabs.com/v1

# Aptos Explorer URL
APTOS_EXPLORER_URL=https://explorer.aptoslabs.com/?network=testnet

# =============================================================================
# CONTRACT CONFIGURATION
# =============================================================================

# Stealth Address Contract Address (deployed on testnet)
STEALTH_CONTRACT_ADDRESS=0x2e04b9fdd49ae932c8b08f04540363233093fec62579139722eb4b6a9f33464c

# =============================================================================
# SERVER CONFIGURATION
# =============================================================================

# Server Port
PORT=3001

# Server Host
HOST=localhost

# Environment
NODE_ENV=development

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================

# JWT Secret for session management (32+ characters)
JWT_SECRET=4e29a7f69f1d33a8c68d2c169b0a37894170c0d6ba6da05d405c0f44475c87a2

# Encryption key for meta keys (32 characters)
ENCRYPTION_KEY=76973823e5702f2e59d57756b74eb91f0d832439242744c47f475f7d8b431108

# =============================================================================
# LOGGING CONFIGURATION
# =============================================================================

# Log Level (error, warn, info, debug)
LOG_LEVEL=info

# =============================================================================
# CORS CONFIGURATION
# =============================================================================

# Allowed Origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

## 🚀 **SETUP STEPS**

### **1. Create Supabase Project**
- Go to https://supabase.com
- Click "New Project"
- Enter project details
- Set database password
- Select region

### **2. Get Supabase Credentials**
- Go to Settings > API in your Supabase dashboard
- Copy **Project URL** → `SUPABASE_URL`
- Copy **anon public** key → `SUPABASE_ANON_KEY`
- Copy **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### **3. Create .env.local File**
- Copy the content above to `.env.local` in `furtim-backend` folder
- Update with your actual Supabase credentials
- Keep the generated security keys

### **4. Test Configuration**
```bash
# Test database connection
node -e "require('./src/config/database.ts').testDatabaseConnection()"

# Check database health
node -e "require('./src/config/database.ts').checkDatabaseHealth()"
```

## ✅ **VERIFICATION**

After setup, you should see:
- ✅ Database connection successful
- ✅ All 17 tables accessible
- ✅ RLS policies active
- ✅ Contract configuration loaded

## 🔐 **SECURITY NOTES**

- **JWT_SECRET**: Used for session management and authentication
- **ENCRYPTION_KEY**: Used for encrypting user meta keys
- **SUPABASE_SERVICE_ROLE_KEY**: Has admin access, keep secure
- **SUPABASE_ANON_KEY**: Public key for client-side operations

## 📊 **WHAT THIS ENABLES**

With this configuration, your backend will have:
- ✅ Database connectivity to Supabase
- ✅ Aptos blockchain integration
- ✅ Stealth address contract interaction
- ✅ User authentication and sessions
- ✅ Encrypted meta key storage
- ✅ Payment processing capabilities
- ✅ Analytics and monitoring

The database will be ready for the complete Furtim stealth address payment system! 🚀
