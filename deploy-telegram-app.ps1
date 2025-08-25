# 🚀 Telegram Mini App Deployment Script
# This script helps deploy your Taskquer Mini App

Write-Host "🚀 Taskquer Telegram Mini App Deployment" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Check if build exists
if (-not (Test-Path "dist")) {
    Write-Host "❌ Build folder not found. Please run 'npm run build' first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build folder found!" -ForegroundColor Green

# Show deployment options
Write-Host "`n📱 Choose deployment method:" -ForegroundColor Yellow
Write-Host "1. Vercel (Recommended - Free, Easy)" -ForegroundColor White
Write-Host "2. Netlify (Free, Easy)" -ForegroundColor White
Write-Host "3. Custom Server (Manual)" -ForegroundColor White
Write-Host "4. Local Testing" -ForegroundColor White

$choice = Read-Host "`nEnter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host "`n🚀 Deploying to Vercel..." -ForegroundColor Green
        
        # Check if Vercel CLI is installed
        try {
            $vercelVersion = vercel --version
            Write-Host "✅ Vercel CLI found: $vercelVersion" -ForegroundColor Green
        } catch {
            Write-Host "📦 Installing Vercel CLI..." -ForegroundColor Yellow
            npm install -g vercel
        }
        
        Write-Host "`n🔧 Deploying to Vercel..." -ForegroundColor Yellow
        Write-Host "Note: Follow the prompts to configure your project" -ForegroundColor White
        
        vercel --prod
        
        Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
        Write-Host "📱 Update your Telegram bot with the new URL" -ForegroundColor Yellow
    }
    
    "2" {
        Write-Host "`n🚀 Deploying to Netlify..." -ForegroundColor Green
        
        Write-Host "📋 Manual steps:" -ForegroundColor Yellow
        Write-Host "1. Go to https://netlify.com" -ForegroundColor White
        Write-Host "2. Sign up/Login" -ForegroundColor White
        Write-Host "3. Drag and drop the 'dist/public' folder" -ForegroundColor White
        Write-Host "4. Copy the generated URL" -ForegroundColor White
        Write-Host "5. Update your Telegram bot with the new URL" -ForegroundColor White
        
        # Open dist/public folder
        Write-Host "`n📁 Opening build folder..." -ForegroundColor Yellow
        Start-Process "dist/public"
    }
    
    "3" {
        Write-Host "`n🚀 Custom Server Deployment..." -ForegroundColor Green
        
        Write-Host "📋 Manual steps:" -ForegroundColor Yellow
        Write-Host "1. Upload 'dist/public' folder to your server" -ForegroundColor White
        Write-Host "2. Ensure HTTPS is configured" -ForegroundColor White
        Write-Host "3. Update your Telegram bot with the new URL" -ForegroundColor White
        
        # Show build folder
        Write-Host "`n📁 Build folder location:" -ForegroundColor Yellow
        Write-Host (Resolve-Path "dist/public") -ForegroundColor White
    }
    
    "4" {
        Write-Host "`n🧪 Local Testing..." -ForegroundColor Green
        
        Write-Host "📋 To test locally:" -ForegroundColor Yellow
        Write-Host "1. Run 'npm run dev'" -ForegroundColor White
        Write-Host "2. Open http://localhost:5000" -ForegroundColor White
        Write-Host "3. You'll see the Telegram App Launcher" -ForegroundColor White
        Write-Host "4. To test in Telegram, deploy to HTTPS first" -ForegroundColor White
        
        $testChoice = Read-Host "`nStart local development server? (y/n)"
        if ($testChoice -eq "y" -or $testChoice -eq "Y") {
            Write-Host "`n🚀 Starting development server..." -ForegroundColor Green
            npm run dev
        }
    }
    
    default {
        Write-Host "❌ Invalid choice. Please run the script again." -ForegroundColor Red
    }
}

Write-Host "`n📚 Next Steps:" -ForegroundColor Green
Write-Host "1. Update your Telegram bot with the new URL" -ForegroundColor White
Write-Host "2. Test the Mini App in Telegram" -ForegroundColor White
Write-Host "3. Configure bot commands and menu button" -ForegroundColor White
Write-Host "4. Read TELEGRAM_MINI_APP_SETUP.md for detailed instructions" -ForegroundColor White

Write-Host "`n🎉 Happy deploying!" -ForegroundColor Green
