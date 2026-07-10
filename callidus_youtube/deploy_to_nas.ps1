# ─── Callidus V2-Deployment auf die NAS ──────────────────────────
# Start: Doppelklick auf deploy_v2.bat  ODER
#        powershell -ExecutionPolicy Bypass -File C:\Users\marga\callidus_youtube\deploy_to_nas.ps1
# Nutzt tar-über-ssh (kein SFTP noetig, nur 1x Passwort) und verifiziert remote.

$nasUser = "arnold.jedich"
$nasHost = "192.168.178.200"
$nasPort = 54122
$nasPath = "/volume1/homes/arnold.jedich/callidus_youtube"

# Immer im Skript-Ordner arbeiten (egal von wo gestartet)
Set-Location $PSScriptRoot

$files = @("fal_client.py", "instagram_bot_v2.py", "main_v2.py", "main.py", "instagram_bot.py")

# Lokale Dateien pruefen
$missing = $files | Where-Object { -not (Test-Path $_) }
if ($missing) {
    Write-Host "FEHLER: Fehlende Dateien im Ordner ${PSScriptRoot}: $($missing -join ', ')" -ForegroundColor Red
    exit 1
}

Write-Host "=== Kopiere $($files.Count) Dateien per tar/ssh (1x Passwort) ===" -ForegroundColor Cyan

# Remote-Befehl OHNE doppelte Anfuehrungszeichen (cmd-sicher)
$remoteCmd = "cd $nasPath && tar -xf - && " +
    "/usr/local/bin/python3.9 -m py_compile fal_client.py instagram_bot_v2.py main_v2.py main.py instagram_bot.py && " +
    "echo --- Marker-Check --- && " +
    "echo Seedance:`$(grep -c generate_ai_video_seedance fal_client.py) && " +
    "echo Affiliate:`$(grep -c AFFILIATE_PRODUKTE instagram_bot_v2.py) && " +
    "echo FaktenFormat:`$(grep -c FAKTEN-FORMAT instagram_bot_v2.py) && " +
    "echo LeberchBlock:`$(grep -c leberch instagram_bot_v2.py) && " +
    "echo DEPLOY_OK"

# Binaer-Pipe muss durch cmd laufen (PowerShell-Pipes zerstoeren Binaerdaten)
$pipeline = 'tar -cf - ' + ($files -join ' ') +
            ' | ssh -p ' + $nasPort + ' ' + $nasUser + '@' + $nasHost + ' "' + $remoteCmd + '"'
cmd /c $pipeline

if ($LASTEXITCODE -ne 0) {
    Write-Host "FEHLER: Deployment fehlgeschlagen (Exit $LASTEXITCODE)." -ForegroundColor Red
    exit 1
}
Write-Host ""
Write-Host "Wenn oben 'DEPLOY_OK' steht und alle Marker >= 1 sind, ist der neue V2-Code aktiv." -ForegroundColor Green
