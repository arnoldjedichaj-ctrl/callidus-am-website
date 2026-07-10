#!/bin/bash
LOG=/volume1/homes/arnold.jedich/callidus_youtube/logs/watchdog.log
BOT=/volume1/homes/arnold.jedich/callidus_youtube/main_v2.py

if ! pgrep -f "callidus_youtube/main_v2.py" > /dev/null 2>&1; then
    echo "$(date): YouTube v2 Bot nicht gefunden – starte neu" >> "$LOG"
    cd /volume1/homes/arnold.jedich/callidus_youtube
    nohup /usr/local/bin/python3.9 "$BOT" --bot >> /volume1/homes/arnold.jedich/callidus_youtube/logs/yt_v2_bot.log 2>&1 &
    echo "$(date): YouTube v2 Bot gestartet (PID $!)" >> "$LOG"
fi
