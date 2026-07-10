@echo off
REM ══════════════════════════════════════════════════════════════
REM  Callidus A&M – V1 Bots Deploy auf NAS
REM  Einmal-Passwort-Version: tar -> 1x SSH -> kopieren + restart + verify
REM ══════════════════════════════════════════════════════════════

SET NAS_USER=arnold.jedich
SET NAS_IP=192.168.178.200
SET NAS_PORT=54122
SET NAS_PATH=/volume1/homes/arnold.jedich/callidus_youtube

cd /d "%~dp0"

ECHO.
ECHO Deploy auf NAS %NAS_IP%:%NAS_PORT% mit nur EINER Passwortabfrage...
ECHO.

tar -cf - main.py instagram_bot.py watchdog_youtube.sh watchdog_instagram.sh CALLIDUS_GROWTH_OPERATOR_MODE.md *.mp3 2>NUL | ssh -p %NAS_PORT% %NAS_USER%@%NAS_IP% "set -e; mkdir -p %NAS_PATH%/assets %NAS_PATH%/logs; cd %NAS_PATH%; tar -xf -; for f in *.mp3; do [ -f \"$f\" ] && mv -f \"$f\" assets/; done; rm -f fal_client.py; pkill -f '[m]ain_v2.py' 2>/dev/null || true; pkill -f '[i]nstagram_bot_v2.py' 2>/dev/null || true; pkill -f '[c]allidus_youtube/main.py --bot' 2>/dev/null || true; pkill -f '[i]nstagram_bot.py --bot' 2>/dev/null || true; sleep 2; chmod +x watchdog_youtube.sh watchdog_instagram.sh; grep -q 'CALLIDUS_MAIN_VERSION_MARKER=GROWTH_CTA_KARAOKE_OFF_2026_06_11' main.py && echo MAIN_VERSION_OK; grep -q 'CALLIDUS_INSTAGRAM_VERSION_MARKER=GROWTH_CTA_KARAOKE_OFF_2026_06_11' instagram_bot.py && echo INSTAGRAM_VERSION_OK; grep -q 'Mitlese-/Motivationstext-Overlay deaktiviert' main.py && echo MAIN_KARAOKE_OFF; grep -q 'Karaoke/Mitlese-Untertitel deaktiviert' instagram_bot.py && echo INSTAGRAM_KARAOKE_OFF; grep -q 'FAL_API_KEY = ' instagram_bot.py && echo FAL_DISABLED_OK; bash watchdog_youtube.sh; bash watchdog_instagram.sh; sleep 2; echo '--- PROZESSE ---'; pgrep -af '[c]allidus_youtube/main.py --bot|[i]nstagram_bot.py --bot' || true; echo '--- WATCHDOG LOG ---'; tail -n 20 logs/watchdog.log 2>/dev/null || true; echo '--- INSTA LOG ---'; tail -n 20 logs/insta_console.log 2>/dev/null || true; echo '--- YT LOG ---'; tail -n 20 logs/yt_bot.log 2>/dev/null || true; echo V1_BOTS_GESTARTET"

IF ERRORLEVEL 1 (
  ECHO.
  ECHO FEHLER: Deploy fehlgeschlagen.
  PAUSE
  EXIT /B 1
)

ECHO.
ECHO Deploy abgeschlossen.
ECHO Erwartet oben: MAIN_VERSION_OK, INSTAGRAM_VERSION_OK, KARAOKE_OFF, FAL_DISABLED_OK, Prozessliste.
ECHO Danach per Telegram testen: /jetzt
ECHO.
PAUSE
