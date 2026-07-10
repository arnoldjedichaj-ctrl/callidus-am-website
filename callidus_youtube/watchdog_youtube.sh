#!/bin/bash
LOG=/volume1/homes/arnold.jedich/callidus_youtube/logs/watchdog.log
BOT=/volume1/homes/arnold.jedich/callidus_youtube/main.py

if ! pgrep -f "[c]allidus_youtube/main.py --bot" > /dev/null 2>&1; then
    echo "$(date): YouTube Bot nicht gefunden – starte neu" >> "$LOG"
    cd /volume1/homes/arnold.jedich/callidus_youtube
    nohup /usr/local/bin/python3.9 "$BOT" --bot >> /volume1/homes/arnold.jedich/callidus_youtube/logs/yt_bot.log 2>&1 &
    sleep 1
    if pgrep -f "[c]allidus_youtube/main.py --bot" > /dev/null 2>&1; then
        echo "$(date): YouTube Bot gestartet (PID $!)" >> "$LOG"
    else
        echo "$(date): YouTube Bot START FEHLGESCHLAGEN" >> "$LOG"
    fi
fi
