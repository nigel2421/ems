#!/bin/bash
set +e

cd /var/www/kutatech-api || exit 0

# Terminate existing server.mjs processes
for pid in $(pgrep -f "server.mjs" 2>/dev/null); do
  kill "$pid" 2>/dev/null || true
done

sleep 1

for pid in $(pgrep -f "server.mjs" 2>/dev/null); do
  kill -9 "$pid" 2>/dev/null || true
done

sleep 1

# Launch the updated server.mjs in background
nohup /usr/bin/node /var/www/kutatech-api/server.mjs > /var/www/kutatech-api/server.log 2>&1 &

sleep 2

exit 0
