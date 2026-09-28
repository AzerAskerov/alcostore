# Alco Store — local development (TurMat/start-local.ps1 modeli)
#
#   .\start-local.ps1              # API + veb + tunel + Expo (Expo Go QR)
#   .\start-local.ps1 -SkipMobile
#   .\start-local.ps1 -SkipTunnel  # tunelsiz: telefon API-yə LAN IP ilə qoşulur
#
# TurMat-dan fərq: bütün node proseslərini deyil, yalnız bu layihənin portlarını (8787/3000/8081) bağlayır —
# paralel işləyən TurMat/PartoMat serverlərinə toxunmur.

param(
    [switch]$SkipMobile = $false,
    [switch]$SkipTunnel = $false
)

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$ports = @(8787, 3000, 8081)

function Stop-Port($port) {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($c in $conns) { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue }
}

function Wait-Url($url, $tries = 20) {
    for ($i = 0; $i -lt $tries; $i++) {
        try {
            $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
            if ($r.StatusCode -lt 500) { return $true }
        } catch { Start-Sleep -Seconds 2 }
    }
    return $false
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Alco Store — Local Development" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# [1] Portları azad et
Write-Host "[1/5] Köhnə proseslər dayandırılır (8787, 3000, 8081)..." -ForegroundColor Yellow
foreach ($p in $ports) { Stop-Port $p }
Get-CimInstance Win32_Process -Filter "Name = 'cloudflared.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like '*alcostore*' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 2

$lanIp = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.IPAddress -like '192.168.*' -or $_.IPAddress -like '10.*' } |
    Select-Object -First 1).IPAddress
if (-not $lanIp) { $lanIp = '127.0.0.1' }

# [2] Tunel
$tunnelReady = $false
if (-not $SkipTunnel) {
    Write-Host "[2/5] Cloudflare Tunnel (alcostore-local)..." -ForegroundColor Yellow
    Start-Process -FilePath cloudflared -ArgumentList 'tunnel', '--config', "$root\cloudflared.yml", 'run', 'alcostore-local' -WindowStyle Hidden | Out-Null
} else {
    Write-Host "[2/5] Tunel keçildi (-SkipTunnel)" -ForegroundColor Gray
}

# [3] API — local D1 migrations + wrangler dev (bütün interfeyslərdə)
Write-Host "[3/5] API (wrangler dev :8787)..." -ForegroundColor Yellow
Push-Location "$root\api"
npm run migrate:local | Out-Null
Pop-Location

# Tunel hazır olsa hər şey sabit https domenlərdən, olmasa LAN IP-dən işləyir
$apiPublic = "http://${lanIp}:8787"
$webPublic = 'http://localhost:3000'
# Şəkil URL-ləri (R2_PUBLIC_URL) LAN IP ilə verilir — eyni Wi-Fi-dakı telefon da görür
$apiCmd = "cd '$root\api'; npx wrangler dev --env local --local --ip 0.0.0.0 --port 8787 " +
    "--var R2_PUBLIC_URL:$apiPublic/media --var API_BASE_URL:$apiPublic"
Start-Process powershell -ArgumentList '-NoExit', '-Command', $apiCmd -WindowStyle Minimized | Out-Null
if (Wait-Url 'http://localhost:8787/health') { Write-Host "  ✅ API: http://localhost:8787" -ForegroundColor Green }
else { Write-Host "  ⚠️  API hələ açılmayıb" -ForegroundColor Yellow }

if (-not $SkipTunnel) {
    $tunnelReady = Wait-Url 'https://local-api.alcostorebaku.az/health' 10
    if ($tunnelReady) {
        $apiPublic = 'https://local-api.alcostorebaku.az'
        $webPublic = 'https://local.alcostorebaku.az'
        Write-Host "  ✅ Tunel: $apiPublic" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Tunel cavab vermir — LAN IP ($lanIp) istifadə olunur. Setup: docs/LOCAL_DEV.md" -ForegroundColor Yellow
    }
}

# [4] Veb
Write-Host "[4/5] Veb (next dev :3000)..." -ForegroundColor Yellow
$webCmd = "cd '$root\alcostore-web'; `$env:NEXT_PUBLIC_API_URL='$apiPublic'; `$env:NEXT_PUBLIC_ENV='local'; `$env:NEXT_PUBLIC_BASE_URL='$webPublic'; npx next dev --port 3000"
Start-Process powershell -ArgumentList '-NoExit', '-Command', $webCmd -WindowStyle Minimized | Out-Null

# [5] Expo (Expo Go, fiziki cihaz)
if (-not $SkipMobile) {
    Write-Host "[5/5] Expo Metro (:8081, LAN $lanIp)..." -ForegroundColor Yellow
    $mobCmd = "cd '$root\alcostore-mobile'; `$env:REACT_NATIVE_PACKAGER_HOSTNAME='$lanIp'; `$env:EXPO_PUBLIC_ENV='development'; `$env:EXPO_PUBLIC_API_URL='$apiPublic'; npx expo start --go --lan --port 8081 --clear"
    Start-Process powershell -ArgumentList '-NoExit', '-Command', $mobCmd -WindowStyle Normal | Out-Null
} else {
    Write-Host "[5/5] Mobil keçildi (-SkipMobile)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  API:   $apiPublic" -ForegroundColor White
Write-Host "  Veb:   $webPublic  (admin: /admin → 'Local giriş')" -ForegroundColor White
if (-not $SkipMobile) { Write-Host "  Expo:  exp://${lanIp}:8081  (Expo Go → Enter URL manually)" -ForegroundColor White }
Write-Host "  Dayandırmaq: .\stop-local.ps1" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
