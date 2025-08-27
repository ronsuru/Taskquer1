@echo off
echo Setting up Taskquer1 development environment...

echo.
echo 1. Creating .env file...
echo DATABASE_URL="postgresql://username:password@localhost:5432/taskquer1_dev" > .env
echo NODE_ENV=development >> .env
echo PORT=5000 >> .env

echo.
echo 2. Installing dependencies...
call npm install

echo.
echo 3. TypeScript check...
call npm run check

echo.
echo Setup complete! 
echo.
echo IMPORTANT: You need to:
echo 1. Update the DATABASE_URL in .env with your actual database credentials
echo 2. Make sure you have PostgreSQL running locally or use a cloud service like Neon
echo 3. Run 'npm run dev' to start the development server
echo.
pause
