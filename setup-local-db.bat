@echo off
echo Setting up local PostgreSQL database for Taskquer1...

echo.
echo Prerequisites:
echo 1. PostgreSQL must be installed on your system
echo 2. PostgreSQL service must be running
echo 3. Default user 'postgres' must exist

echo.
echo Please ensure PostgreSQL is installed from:
echo https://www.postgresql.org/download/windows/
echo.
echo After installation, run this script again to set up the database.
echo.
pause

echo.
echo Checking PostgreSQL installation...
psql --version >nul 2>&1
if %errorlevel% equ 0 (
    echo PostgreSQL found in PATH
) else (
    echo PostgreSQL not found in PATH
    echo Please install PostgreSQL first
    pause
    exit /b 1
)

echo.
echo Attempting to create database...
set PGPASSWORD=password
psql -U postgres -h localhost -c "CREATE DATABASE taskquer1_dev;" 2>nul
if %errorlevel% equ 0 (
    echo Database 'taskquer1_dev' created successfully!
) else (
    echo Database creation failed or database already exists
    echo You may need to create it manually:
    echo   psql -U postgres
    echo   CREATE DATABASE taskquer1_dev;
    echo   \q
)

echo.
echo Updating .env file...
(
echo DATABASE_URL=postgresql://postgres:password@localhost:5432/taskquer1_dev
echo NODE_ENV=development
echo PORT=5000
echo TELEGRAM_BOT_TOKEN=8318172960:AAHzUKr1nga8hhIkuMz3bHUBb45j-4nWc8U
) > .env

echo .env file updated with local database configuration

echo.
echo Setup complete!
echo.
echo Next steps:
echo 1. Verify your PostgreSQL password matches the one in .env
echo 2. If you used a different password, update the .env file
echo 3. Run 'npm run dev' to start the development server
echo.
pause
