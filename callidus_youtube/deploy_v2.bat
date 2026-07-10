@echo off
REM ─── V2-Deployment (Fakten-Format + Seedance) auf die NAS ─────────
REM Funktioniert per Doppelklick UND aus cmd. Startet das PowerShell-
REM Skript deploy_to_nas.ps1 mit Bypass (umgeht die .ps1-Skript-Sperre).
REM
REM ACHTUNG: NICHT deploy_to_nas.bat benutzen wenn V2 laufen soll –
REM die alte .bat loescht fal_client.py auf der NAS und startet V1!
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy_to_nas.ps1"
pause
