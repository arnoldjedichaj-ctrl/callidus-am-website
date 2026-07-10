@echo off
SET NAS_USER=arnold.jedich
SET NAS_IP=192.168.178.200
SET NAS_PORT=54122
SET NAS_PATH=/volume1/homes/arnold.jedich/callidus_youtube

ECHO Pruefe Bots auf NAS %NAS_IP%...
ssh -p %NAS_PORT% %NAS_USER%@%NAS_IP% "cd %NAS_PATH%; echo '--- PROZESSE ---'; pgrep -af '[c]allidus_youtube/main.py --bot|[i]nstagram_bot.py --bot' || echo KEINE_BOT_PROZESSE; echo '--- WATCHDOG LOG ---'; tail -n 40 logs/watchdog.log 2>/dev/null || true; echo '--- INSTA LOG ---'; tail -n 60 logs/insta_console.log 2>/dev/null || true; echo '--- YT LOG ---'; tail -n 60 logs/yt_bot.log 2>/dev/null || true"
PAUSE
