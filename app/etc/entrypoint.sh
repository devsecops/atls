#!/bin/sh
cd /opt/atls
echo "[+] Installing dependencies"
npm install
echo "[+] Starting localtunnel"
./etc/run_lt.sh &
echo "[+] Starting bot with nodemon"
./node_modules/nodemon/bin/nodemon.js -L index.js -L plugins/*.js
