#!/bin/bash
LOG=/volume1/homes/arnold.jedich/callidus_youtube/logs/watchdog.log
BOT=/volume1/homes/arnold.jedich/callidus_youtube/instagram_bot_v2.py

if ! pgrep -f "instagram_bot_v2.py" > /dev/null 2>&1; then
    echo "$(date): Instagram v2 Bot nicht gefunden – starte neu" >> "$LOG"
    cd /volume1/homes/arnold.jedich/callidus_youtube
    nohup /usr/local/bin/python3.9 "$BOT" --bot >> /volume1/homes/arnold.jedich/callidus_youtube/logs/insta_v2_console.log 2>&1 &
    echo "$(date): Instagram v2 Bot gestartet (PID $!)" >> "$LOG"
fi
