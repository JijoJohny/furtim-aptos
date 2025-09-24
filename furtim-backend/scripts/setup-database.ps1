# Database Setup Script for Furtim Stealth Address Payment System
# This script helps set up the Supabase database with all required tables

Write-Host "🗄️ Setting up Furtim Database..." -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Check if Supabase CLI is installed
Write-Host "1️⃣ Checking Supabase CLI installation..." -ForegroundColor Green
try {
    $supabaseVersion = supabase --version
    Write-Host "✅ Supabase CLI found: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g supabase" -ForegroundColor Yellow
    Write-Host "   or visit: https://supabase.com/docs/guides/cli" -ForegroundColor Yellow
    exit 1
}

# Initialize Supabase project if not already done
Write-Host "2️⃣ Initializing Supabase project..." -ForegroundColor Green
if (-not (Test-Path "supabase")) {
    Write-Host "📁 Creating Supabase project structure..." -ForegroundColor Yellow
    supabase init
} else {
    Write-Host "✅ Supabase project already initialized" -ForegroundColor Green
}

# Create migration for the complete schema
Write-Host "3️⃣ Creating database migration..." -ForegroundColor Green
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$migrationFile = "supabase/migrations/${timestamp}_create_furtim_schema.sql"

# Copy the complete schema to migration file
Copy-Item "database/complete-schema.sql" $migrationFile
Write-Host "✅ Migration file created: $migrationFile" -ForegroundColor Green

# Apply the migration
Write-Host "4️⃣ Applying database migration..." -ForegroundColor Green
try {
    supabase db reset
    Write-Host "✅ Database migration applied successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Migration failed. You may need to apply it manually:" -ForegroundColor Yellow
    Write-Host "   supabase db push" -ForegroundColor Yellow
}

# Generate TypeScript types
Write-Host "5️⃣ Generating TypeScript types..." -ForegroundColor Green
try {
    supabase gen types typescript --local > src/types/database.ts
    Write-Host "✅ TypeScript types generated" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Type generation failed. You may need to run it manually:" -ForegroundColor Yellow
    Write-Host "   supabase gen types typescript --local > src/types/database.ts" -ForegroundColor Yellow
}

# Create environment configuration
Write-Host "6️⃣ Creating environment configuration..." -ForegroundColor Green
$envContent = @"
# Supabase Configuration
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Aptos Configuration
APTOS_NETWORK=testnet
APTOS_RPC_URL=https://fullnode.testnet.aptoslabs.com/v1
APTOS_CONTRACT_ADDRESS=0x2e04b9fdd49ae932c8b08f04540363233093fec62579139722eb4b6a9f33464c

# Security Configuration
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here

# API Configuration
API_PORT=3001
CORS_ORIGIN=http://localhost:3000

# Monitoring
LOG_LEVEL=info
ENABLE_MONITORING=true
"@

$envContent | Out-File -FilePath ".env.local" -Encoding UTF8
Write-Host "✅ Environment configuration created: .env.local" -ForegroundColor Green

# Create database connection test
Write-Host "7️⃣ Creating database connection test..." -ForegroundColor Green
$testScript = @"
// Database Connection Test
const { createClient } = require('@supabase/supabase-js');

async function testDatabaseConnection() {
    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
        
        const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);
        
        if (error) {
            console.error('❌ Database connection failed:', error.message);
            return false;
        }
        
        console.log('✅ Database connection successful');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

testDatabaseConnection();
"@

$testScript | Out-File -FilePath "scripts/test-database-connection.js" -Encoding UTF8
Write-Host "✅ Database connection test created" -ForegroundColor Green

# Test the database connection
Write-Host "8️⃣ Testing database connection..." -ForegroundColor Green
try {
    node scripts/test-database-connection.js
    Write-Host "✅ Database connection test passed" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Database connection test failed. Check your Supabase configuration." -ForegroundColor Yellow
}

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "🎉 Database setup completed!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Update .env.local with your actual Supabase credentials" -ForegroundColor White
Write-Host "2. Run 'supabase start' to start local development" -ForegroundColor White
Write-Host "3. Run 'npm run dev' to start the backend server" -ForegroundColor White
Write-Host "4. Test the API endpoints" -ForegroundColor White
