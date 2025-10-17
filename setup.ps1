# Courtly - Initial Setup Script (Windows PowerShell)

Write-Host "🏸 Courtly - Setup Script" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion found" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check if Go is installed
Write-Host "Checking Go installation..." -ForegroundColor Yellow
try {
    $goVersion = go version
    Write-Host "✓ $goVersion found" -ForegroundColor Green
} catch {
    Write-Host "✗ Go not found. Please install Go 1.21+ from https://go.dev" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Installing Frontend Dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Installing Backend Dependencies..." -ForegroundColor Yellow
Set-Location backend
go mod download

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install backend dependencies" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "✓ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Set up Firebase (see SETUP.md)" -ForegroundColor White
Write-Host "2. Configure .env.local file" -ForegroundColor White
Write-Host "3. Configure backend/.env file" -ForegroundColor White
Write-Host "4. Run 'npm run dev' to start frontend" -ForegroundColor White
Write-Host "5. Run 'cd backend && go run main.go' to start backend" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see SETUP.md" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Green
