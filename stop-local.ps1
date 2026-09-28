# Alco Store — local servisləri dayandırır (yalnız bu layihənin portları və tuneli)

$ports = @(8787, 3000, 8081)
foreach ($p in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
    foreach ($c in $conns) {
        Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "  ✅ Port $p azad edildi (PID $($c.OwningProcess))" -ForegroundColor Green
    }
}
Get-CimInstance Win32_Process -Filter "Name = 'cloudflared.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like '*alcostore*' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue; Write-Host "  ✅ Tunel dayandırıldı" -ForegroundColor Green }
Get-CimInstance Win32_Process -Filter "Name = 'workerd.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like '*AlcoStore*' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Write-Host "Hazır." -ForegroundColor Cyan
