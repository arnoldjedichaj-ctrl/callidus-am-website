#!/bin/bash
LOG=/volume1/homes/arnold.jedich/callidus_youtube/logs/watchdog.log
BOT=/volume1/homes/arnold.jedich/callidus_youtube/instagram_bot.py

if ! pgrep -f "[i]nstagram_bot.py --bot" > /dev/null 2>&1; then
    echo "$(date): Instagram Bot nicht gefunden – starte neu" >> "$LOG"
    cd /volume1/homes/arnold.jedich/callidus_youtube
    nohup /usr/local/bin/python3.9 "$BOT" --bot >> /volume1/homes/arnold.jedich/callidus_youtube/logs/insta_console.log 2>&1 &
    sleep 1
    if pgrep -f "[i]nstagram_bot.py --bot" > /dev/null 2>&1; then
        echo "$(date): Instagram Bot gestartet (PID $!)" >> "$LOG"
    else
        echo "$(date): Instagram Bot START FEHLGESCHLAGEN" >> "$LOG"
    fi
fi
