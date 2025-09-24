# Supabase Setup Script for Furtim Database
# This script helps you set up the database schema on Supabase

Write-Host "🗄️ Setting up Supabase Database for Furtim..." -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

Write-Host "📋 SUPABASE SETUP STEPS:" -ForegroundColor Yellow
Write-Host "1. Create a Supabase project at https://supabase.com" -ForegroundColor White
Write-Host "2. Get your project URL and API keys" -ForegroundColor White
Write-Host "3. Run the database schema migration" -ForegroundColor White
Write-Host "4. Configure environment variables" -ForegroundColor White

Write-Host "`n🔧 MANUAL SETUP STEPS:" -ForegroundColor Green

Write-Host "`n1️⃣ Create Supabase Project:" -ForegroundColor Green
Write-Host "   - Go to https://supabase.com" -ForegroundColor White
Write-Host "   - Click 'New Project'" -ForegroundColor White
Write-Host "   - Choose organization and enter project details" -ForegroundColor White
Write-Host "   - Set database password (save it securely!)" -ForegroundColor White
Write-Host "   - Select region closest to your users" -ForegroundColor White

Write-Host "`n2️⃣ Get Project Credentials:" -ForegroundColor Green
Write-Host "   - Go to Settings > API" -ForegroundColor White
Write-Host "   - Copy 'Project URL' (SUPABASE_URL)" -ForegroundColor White
Write-Host "   - Copy 'anon public' key (SUPABASE_ANON_KEY)" -ForegroundColor White
Write-Host "   - Copy 'service_role' key (SUPABASE_SERVICE_ROLE_KEY)" -ForegroundColor White

Write-Host "`n3️⃣ Run Database Schema:" -ForegroundColor Green
Write-Host "   - Go to SQL Editor in Supabase dashboard" -ForegroundColor White
Write-Host "   - Copy contents of 'database/complete-schema.sql'" -ForegroundColor White
Write-Host "   - Paste and run the SQL commands" -ForegroundColor White
Write-Host "   - Verify all tables are created successfully" -ForegroundColor White

Write-Host "`n4️⃣ Configure Environment Variables:" -ForegroundColor Green
Write-Host "   - Update .env.local with your Supabase credentials" -ForegroundColor White
Write-Host "   - Update config.production.env for production" -ForegroundColor White

Write-Host "`n📊 DATABASE TABLES THAT WILL BE CREATED:" -ForegroundColor Yellow
$tables = @(
    "users", "user_meta_keys", "user_sessions", "payment_links",
    "transactions", "stealth_addresses", "stealth_transactions",
    "stealth_events", "stealth_balances", "indexer_state",
    "system_logs", "link_analytics", "user_activity",
    "user_settings", "user_notifications", "security_events", "api_keys"
)

foreach ($table in $tables) {
    Write-Host "   ✅ $table" -ForegroundColor Green
}

Write-Host "`n🔒 SECURITY FEATURES:" -ForegroundColor Yellow
Write-Host "   ✅ Row Level Security (RLS) enabled on all tables" -ForegroundColor Green
Write-Host "   ✅ User-specific data access policies" -ForegroundColor Green
Write-Host "   ✅ Public access only for active payment links" -ForegroundColor Green
Write-Host "   ✅ Encrypted meta keys storage" -ForegroundColor Green

Write-Host "`n📈 PERFORMANCE FEATURES:" -ForegroundColor Yellow
Write-Host "   ✅ Optimized indexes for fast queries" -ForegroundColor Green
Write-Host "   ✅ Automatic timestamp updates" -ForegroundColor Green
Write-Host "   ✅ Efficient foreign key relationships" -ForegroundColor Green

Write-Host "`n🧪 TESTING YOUR SETUP:" -ForegroundColor Yellow
Write-Host "   - Run: node -e `"require('./src/config/database.ts').testDatabaseConnection()`" -ForegroundColor White
Write-Host "   - Check Supabase dashboard for created tables" -ForegroundColor White
Write-Host "   - Verify RLS policies are active" -ForegroundColor White

Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "🎉 Supabase setup guide completed!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
