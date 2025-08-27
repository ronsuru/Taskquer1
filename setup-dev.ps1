# PowerShell script to set up Taskquer1 development environment

Write-Host "Setting up Taskquer1 development environment..." -ForegroundColor Green

Write-Host "`n1. Creating .env file..." -ForegroundColor Yellow
@"
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/taskquer1_dev"

# Environment
NODE_ENV=development

# Server Configuration
PORT=5000
"@ | Out-File -FilePath ".env" -Encoding UTF8

Write-Host "`n2. Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host "`n3. TypeScript check..." -ForegroundColor Yellow
npm run check

Write-Host "`nSetup complete!" -ForegroundColor Green
Write-Host "`nIMPORTANT: You need to:" -ForegroundColor Red
Write-Host "1. Update the DATABASE_URL in .env with your actual database credentials" -ForegroundColor White
Write-Host "2. Make sure you have PostgreSQL running locally or use a cloud service like Neon" -ForegroundColor White
Write-Host "3. Run 'npm run dev' to start the development server" -ForegroundColor White

Read-Host "`nPress Enter to continue"
