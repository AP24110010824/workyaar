# ================================================================
# WorkYaar - MySQL Database Setup Script
# Run this in PowerShell as Administrator
# ================================================================

$mysqlExe = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
$sqlFile   = "$PSScriptRoot\setup-db.sql"

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  WorkYaar MySQL Database Setup" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Enter your MySQL root password:" -ForegroundColor Yellow
$rootPass = Read-Host -AsSecureString "Password"
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($rootPass)
$plainPass = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host ""
Write-Host "Running database setup..." -ForegroundColor Yellow

& $mysqlExe -u root "-p$plainPass" --execute "source $sqlFile" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS! Database setup complete." -ForegroundColor Green
    Write-Host "You can now start the server with: npm run dev" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "FAILED. Check your root password and try again." -ForegroundColor Red
}
