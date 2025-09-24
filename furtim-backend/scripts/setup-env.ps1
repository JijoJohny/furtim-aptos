# Environment Variables Setup Script for Furtim Backend
# This script helps you create the correct .env.local file

Write-Host "🔧 Setting up Environment Variables for Furtim Backend..." -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

Write-Host "`n📋 REQUIRED ENVIRONMENT VARIABLES:" -ForegroundColor Yellow

Write-Host "`n🗄️ DATABASE CONFIGURATION (Supabase):" -ForegroundColor Green
Write-Host "   SUPABASE_URL=https://your-project-id.supabase.co" -ForegroundColor White
Write-Host "   SUPABASE_ANON_KEY=your_anon_public_key_here" -ForegroundColor White
Write-Host "   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here" -ForegroundColor White

Write-Host "`n🔗 APTOS NETWORK CONFIGURATION:" -ForegroundColor Green
Write-Host "   APTOS_NETWORK=testnet" -ForegroundColor White
Write-Host "   APTOS_RPC_URL=https://fullnode.testnet.aptoslabs.com/v1" -ForegroundColor White
Write-Host "   APTOS_EXPLORER_URL=https://explorer.aptoslabs.com/?network=testnet" -ForegroundColor White

Write-Host "`n📄 CONTRACT CONFIGURATION:" -ForegroundColor Green
Write-Host "   STEALTH_CONTRACT_ADDRESS=0x2e04b9fdd49ae932c8b08f04540363233093fec62579139722eb4b6a9f33464c" -ForegroundColor White

Write-Host "`n🔐 SECURITY CONFIGURATION:" -ForegroundColor Green
Write-Host "   JWT_SECRET=your_jwt_secret_here" -ForegroundColor White
Write-Host "   ENCRYPTION_KEY=your_32_character_encryption_key_here" -ForegroundColor White

Write-Host "`n🚀 SETUP STEPS:" -ForegroundColor Yellow

Write-Host "`n1️⃣ Create .env.local file:" -ForegroundColor Green
Write-Host "   - Copy database-env-template.txt content" -ForegroundColor White
Write-Host "   - Create .env.local file in furtim-backend folder" -ForegroundColor White
Write-Host "   - Update with your actual Supabase credentials" -ForegroundColor White

Write-Host "`n2️⃣ Get Supabase Credentials:" -ForegroundColor Green
Write-Host "   - Go to https://supabase.com" -ForegroundColor White
Write-Host "   - Open your project dashboard" -ForegroundColor White
Write-Host "   - Go to Settings > API" -ForegroundColor White
Write-Host "   - Copy Project URL (SUPABASE_URL)" -ForegroundColor White
Write-Host "   - Copy anon public key (SUPABASE_ANON_KEY)" -ForegroundColor White
Write-Host "   - Copy service_role key (SUPABASE_SERVICE_ROLE_KEY)" -ForegroundColor White

Write-Host "`n3️⃣ Generate Security Keys:" -ForegroundColor Green
Write-Host "   - Generate JWT_SECRET (32+ characters)" -ForegroundColor White
Write-Host "   - Generate ENCRYPTION_KEY (32 characters)" -ForegroundColor White
Write-Host "   - Use: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"" -ForegroundColor White

Write-Host "`n4️⃣ Test Configuration:" -ForegroundColor Green
Write-Host "   - Run: node -e \"require('./src/config/database.ts').testDatabaseConnection()\"" -ForegroundColor White
Write-Host "   - Check for connection success" -ForegroundColor White

Write-Host "`n📝 EXAMPLE .env.local FILE:" -ForegroundColor Yellow
Write-Host "   SUPABASE_URL=https://abcdefghijklmnop.supabase.co" -ForegroundColor White
Write-Host "   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." -ForegroundColor White
Write-Host "   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." -ForegroundColor White
Write-Host "   APTOS_NETWORK=testnet" -ForegroundColor White
Write-Host "   STEALTH_CONTRACT_ADDRESS=0x2e04b9fdd49ae932c8b08f04540363233093fec62579139722eb4b6a9f33464c" -ForegroundColor White
Write-Host "   JWT_SECRET=your_32_character_jwt_secret_here" -ForegroundColor White
Write-Host "   ENCRYPTION_KEY=your_32_character_encryption_key_here" -ForegroundColor White

Write-Host "`n=====================================================" -ForegroundColor Cyan
Write-Host "🎉 Environment setup guide completed!" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Cyan
