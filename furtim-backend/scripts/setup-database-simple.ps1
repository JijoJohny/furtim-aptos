# Simple Database Setup Script for Furtim
Write-Host "🗄️ Setting up Furtim Database..." -ForegroundColor Cyan

# Create environment file
Write-Host "1️⃣ Creating environment configuration..." -ForegroundColor Green
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
"@

$envContent | Out-File -FilePath ".env.local" -Encoding UTF8
Write-Host "✅ Environment configuration created" -ForegroundColor Green

# Test database configuration
Write-Host "2️⃣ Testing database configuration..." -ForegroundColor Green
node -e "
const { testDatabaseConnection } = require('./src/config/database.ts');
testDatabaseConnection().then(success => {
  if (success) {
    console.log('✅ Database configuration test passed');
  } else {
    console.log('⚠️ Database configuration test failed');
  }
});
"

Write-Host "✅ Database setup completed!" -ForegroundColor Green
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Update .env.local with your Supabase credentials" -ForegroundColor White
Write-Host "2. Run the database schema migration" -ForegroundColor White
Write-Host "3. Start the backend server" -ForegroundColor White
