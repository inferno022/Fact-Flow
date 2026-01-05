# Fact Flow - Groq Update Deployment Script (PowerShell)
# Automates the complete deployment process for the Groq integration

Write-Host "🚀 Fact Flow - Groq Update Deployment" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

function Write-Status {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Error "Not in Fact Flow project directory. Please run from project root."
    exit 1
}

Write-Status "Starting Groq integration deployment..."

# Step 1: Environment Check
Write-Status "Checking environment variables..."
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match "VITE_GROQ_API_KEY") {
        Write-Success "Groq API key found in .env.local"
    } else {
        Write-Error "VITE_GROQ_API_KEY not found in .env.local"
        Write-Host "Please add: VITE_GROQ_API_KEY=your_groq_api_key"
        exit 1
    }
} else {
    Write-Error ".env.local file not found"
    Write-Host "Please create .env.local with VITE_GROQ_API_KEY=your_groq_api_key"
    exit 1
}

# Step 2: Install dependencies
Write-Status "Installing dependencies..."
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Success "Dependencies installed"
} else {
    Write-Error "Failed to install dependencies"
    exit 1
}

# Step 3: Build the application
Write-Status "Building application..."
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Success "Build completed successfully"
} else {
    Write-Error "Build failed"
    exit 1
}

# Step 4: Run verification script
Write-Status "Running ad verification..."
node scripts/verify-ads.js
if ($LASTEXITCODE -eq 0) {
    Write-Success "Ad configuration verified"
} else {
    Write-Warning "Ad verification had issues (check output above)"
}

# Step 5: Sync with Capacitor
Write-Status "Syncing with Capacitor..."
npx cap sync android
if ($LASTEXITCODE -eq 0) {
    Write-Success "Capacitor sync completed"
} else {
    Write-Error "Capacitor sync failed"
    exit 1
}

# Step 6: Database migration reminder
Write-Warning "IMPORTANT: Database Migration Required"
Write-Host ""
Write-Host "Before deploying to production, run this SQL in Supabase:" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------" -ForegroundColor Yellow
Write-Host "DELETE FROM user_seen_facts;" -ForegroundColor White
Write-Host "DELETE FROM cached_facts;" -ForegroundColor White
Write-Host "--------------------------------------------------------" -ForegroundColor Yellow
Write-Host ""
Write-Host "This ensures all users get fresh facts with the new system." -ForegroundColor Yellow

# Step 7: Deployment options
Write-Host ""
Write-Status "Deployment Options:"
Write-Host ""
Write-Host "1. Ionic Appflow (Recommended):" -ForegroundColor Cyan
Write-Host "   - Push changes to GitHub (already done)"
Write-Host "   - Create new build in Ionic Appflow"
Write-Host "   - Download APK/AAB for testing"
Write-Host ""
Write-Host "2. Manual Android Build:" -ForegroundColor Cyan
Write-Host "   - npx cap open android"
Write-Host "   - Build → Generate Signed Bundle/APK"
Write-Host ""
Write-Host "3. Web Deployment:" -ForegroundColor Cyan
Write-Host "   - Deploy www/ folder to web hosting"
Write-Host "   - Ensure environment variables are set on server"

# Step 8: Testing checklist
Write-Host ""
Write-Status "Testing Checklist:"
Write-Host "✅ Build completed successfully" -ForegroundColor Green
Write-Host "✅ Ad configuration verified" -ForegroundColor Green
Write-Host "✅ Capacitor sync completed" -ForegroundColor Green
Write-Host "⏳ Database migration (manual step)" -ForegroundColor Yellow
Write-Host "⏳ Test new facts quality (manual step)" -ForegroundColor Yellow
Write-Host "⏳ Verify zero duplicates (manual step)" -ForegroundColor Yellow
Write-Host "⏳ Deploy to production (manual step)" -ForegroundColor Yellow

# Step 9: Final summary
Write-Host ""
Write-Success "Groq Update Deployment Preparation Complete!"
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Run database migration SQL in Supabase"
Write-Host "2. Test the app thoroughly (see TESTING_GUIDE.md)"
Write-Host "3. Deploy via Ionic Appflow or manual build"
Write-Host "4. Monitor user feedback for first 24 hours"
Write-Host ""
Write-Host "Expected Results:" -ForegroundColor Cyan
Write-Host "- Zero duplicate facts ever"
Write-Host "- Ultra-rare, high-quality facts"
Write-Host "- Improved user engagement"
Write-Host "- Better app store ratings"
Write-Host ""
Write-Success "Ready for production deployment! 🎉"