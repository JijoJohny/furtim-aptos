# Complete System Test Runner
# Runs all functionality tests for the stealth address payment system

Write-Host "🧪 Starting Complete System Tests..." -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Change to backend directory
Set-Location furtim-backend

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "🔍 Running Contract Integration Tests..." -ForegroundColor Green
npm test -- --testPathPattern=contractIntegration.test.ts --verbose

Write-Host "🔍 Running Stealth Address Service Tests..." -ForegroundColor Green
npm test -- --testPathPattern=stealthAddressService.test.ts --verbose

Write-Host "🔍 Running Stealth Indexer Tests..." -ForegroundColor Green
npm test -- --testPathPattern=stealthIndexer.test.ts --verbose

Write-Host "🔍 Running Complete System Tests..." -ForegroundColor Green
npm test -- --testPathPattern=completeSystem.test.ts --verbose

Write-Host "🔍 Running All Tests..." -ForegroundColor Green
npm test -- --verbose

Write-Host "✅ All tests completed!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Cyan
