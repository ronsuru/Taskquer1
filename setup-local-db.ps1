# PowerShell script to set up local PostgreSQL database for Taskquer1

Write-Host "Setting up local PostgreSQL database for Taskquer1..." -ForegroundColor Green

Write-Host "`nPrerequisites:" -ForegroundColor Yellow
Write-Host "1. PostgreSQL must be installed on your system" -ForegroundColor White
Write-Host "2. PostgreSQL service must be running" -ForegroundColor White
Write-Host "3. Default user 'postgres' must exist" -ForegroundColor White

Write-Host "`nChecking PostgreSQL installation..." -ForegroundColor Yellow

# Check if PostgreSQL is installed
try {
    $pgVersion = & psql --version 2>$null
    if ($pgVersion) {
        Write-Host "✅ PostgreSQL found: $pgVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ PostgreSQL not found in PATH" -ForegroundColor Red
        Write-Host "Please install PostgreSQL from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
        Read-Host "Press Enter to continue after installation"
    }
} catch {
    Write-Host "❌ PostgreSQL not found in PATH" -ForegroundColor Red
    Write-Host "Please install PostgreSQL from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Read-Host "Press Enter to continue after installation"
}

Write-Host "`nChecking if PostgreSQL service is running..." -ForegroundColor Yellow

# Check if PostgreSQL service is running
$pgService = Get-Service -Name "*postgresql*" -ErrorAction SilentlyContinue
if ($pgService) {
    if ($pgService.Status -eq "Running") {
        Write-Host "✅ PostgreSQL service is running" -ForegroundColor Green
    } else {
        Write-Host "⚠️  PostgreSQL service is not running. Starting it..." -ForegroundColor Yellow
        Start-Service $pgService
        Start-Sleep -Seconds 3
        if ((Get-Service $pgService).Status -eq "Running") {
            Write-Host "✅ PostgreSQL service started successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to start PostgreSQL service" -ForegroundColor Red
            Write-Host "Please start it manually from Services (services.msc)" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "❌ PostgreSQL service not found" -ForegroundColor Red
    Write-Host "Please ensure PostgreSQL is properly installed" -ForegroundColor Yellow
}

Write-Host "`nAttempting to create database..." -ForegroundColor Yellow

# Try to create the database
try {
    $env:PGPASSWORD = "password"
    $result = & psql -U postgres -h localhost -c "CREATE DATABASE taskquer1_dev;" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database 'taskquer1_dev' created successfully!" -ForegroundColor Green
    } else {
        if ($result -like "*already exists*") {
            Write-Host "✅ Database 'taskquer1_dev' already exists!" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Database creation failed. You may need to create it manually:" -ForegroundColor Yellow
            Write-Host "   psql -U postgres" -ForegroundColor White
            Write-Host "   CREATE DATABASE taskquer1_dev;" -ForegroundColor White
            Write-Host "   \q" -ForegroundColor White
        }
    }
} catch {
    Write-Host "❌ Error connecting to PostgreSQL" -ForegroundColor Red
    Write-Host "Please check your PostgreSQL installation and credentials" -ForegroundColor Yellow
}

Write-Host "`nUpdating .env file..." -ForegroundColor Yellow

# Update .env file with local database URL
$envContent = @"
DATABASE_URL=postgresql://postgres:password@localhost:5432/taskquer1_dev
NODE_ENV=development
PORT=5000
TELEGRAM_BOT_TOKEN=8318172960:AAHzUKr1nga8hhIkuMz3bHUBb45j-4nWc8U
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "✅ .env file updated with local database configuration" -ForegroundColor Green

Write-Host "`nSetup complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Verify your PostgreSQL password matches the one in .env" -ForegroundColor White
Write-Host "2. If you used a different password, update the .env file" -ForegroundColor White
Write-Host "3. Run 'npm run dev' to start the development server" -ForegroundColor White

Write-Host "`nIf you encounter connection issues:" -ForegroundColor Yellow
Write-Host "- Check if PostgreSQL is running on port 5432" -ForegroundColor White
Write-Host "- Verify the password in .env matches your PostgreSQL password" -ForegroundColor White
Write-Host "- Ensure the database 'taskquer1_dev' exists" -ForegroundColor White

Read-Host "`nPress Enter to continue"
