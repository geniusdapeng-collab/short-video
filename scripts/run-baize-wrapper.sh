#!/bin/bash
cd /root/.openclaw/workspace
node scripts/run-baize-preproduction-v6.5.43.js > /tmp/baize-preproduction-v2.log 2>&1
echo "退出码: $?"
