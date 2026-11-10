# ====================================================================
# KuraTech Credential Rotation Automation Script (PowerShell)
# Usage: .\scripts\security\rotate-credentials.ps1
# ====================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "    KuraTech Security Credential Rotation Automation       " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. PostgreSQL Database Password Rotation
Write-Host "`n[1/3] PostgreSQL Database Password Rotation" -ForegroundColor Yellow
$newDbPass = Read-Host "Enter NEW secure password for 'wemisico_adminuser' (leave empty to generate random)"
if ([string]::IsNullOrWhiteSpace($newDbPass)) {
    $bytes = New-Object byte[] 16
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    $newDbPass = [Convert]::ToBase64String($bytes) -replace '[/+=]', 'x'
    Write-Host "Generated secure DB password: $newDbPass" -ForegroundColor Green
}

Write-Host "`nTo rotate the PostgreSQL password on your database host, execute:" -ForegroundColor White
Write-Host "  psql -U postgres -c `"ALTER USER wemisico_adminuser WITH PASSWORD '$newDbPass';`"" -ForegroundColor Green

$updateEnv = Read-Host "`nWould you like to update your local .env with this new DB password? (y/N)"
if ($updateEnv -match '^[Yy]') {
    if (Test-Path ".env") {
        $content = Get-Content ".env" -Raw
        $content = $content -replace "DB_PASSWORD=.*", "DB_PASSWORD=$newDbPass"
        $content = $content -replace "DATABASE_URL=.*", "DATABASE_URL=postgresql://wemisico_adminuser:$newDbPass@localhost:5432/wemisico_ems"
        Set-Content -Path ".env" -Value $content
        Write-Host "Updated .env with new DB_PASSWORD and DATABASE_URL." -ForegroundColor Green
    }
    else {
        Write-Host "No .env file found. Copy .env.example to .env first." -ForegroundColor Red
    }
}

# 2. Google Maps API Key Rotation
Write-Host "`n[2/3] Google Maps Platform API Key Rotation" -ForegroundColor Yellow
Write-Host "To provision a restricted replacement Google Maps key using gcloud CLI:" -ForegroundColor White
Write-Host @"
  # 1. Create a restricted replacement key
  gcloud services api-keys create `
    --display-name="EMS-Google-Maps-Key-Rotated" `
    --allowed-referrers="https://kuratech.site/*,https://ops-konsole.kuratech.site/*,http://localhost:*,http://ops-konsole.localhost:*" `
    --api-target=service=maps-backend.googleapis.com,places-backend.googleapis.com,geocoding-backend.googleapis.com

  # 2. List keys to identify the old compromised key UID
  gcloud services api-keys list

  # 3. Delete the compromised key
  gcloud services api-keys delete <OLD_KEY_UID_OR_NAME>
"@ -ForegroundColor Green

$newMapsKey = Read-Host "`nEnter your NEW Google Maps Platform API key (or press Enter to skip)"
if (-not [string]::IsNullOrWhiteSpace($newMapsKey)) {
    if (Test-Path ".env") {
        $content = Get-Content ".env" -Raw
        $content = $content -replace "VITE_GOOGLE_MAPS_API_KEY=.*", "VITE_GOOGLE_MAPS_API_KEY=$newMapsKey"
        $content = $content -replace "VITE_GOOGLE_MAPS_PLATFORM_KEY=.*", "VITE_GOOGLE_MAPS_PLATFORM_KEY=$newMapsKey"
        $content = $content -replace "GOOGLE_MAPS_PLATFORM_KEY=.*", "GOOGLE_MAPS_PLATFORM_KEY=`"$newMapsKey`""
        Set-Content -Path ".env" -Value $content
        Write-Host "Updated .env with new Google Maps keys." -ForegroundColor Green
    }
}

# 3. Production VPS Handoff
Write-Host "`n[3/3] Production VPS Deployment Handoff" -ForegroundColor Yellow
Write-Host @"
To sync the updated secrets to your production VPS:
  1. SSH into VPS: ssh ubuntu@kuratech.site
  2. Update /var/www/ems/.env with the new credentials.
  3. Restart backend service:
     pm2 restart ems-server
"@ -ForegroundColor White

Write-Host "`nCredential rotation helper completed." -ForegroundColor Cyan
