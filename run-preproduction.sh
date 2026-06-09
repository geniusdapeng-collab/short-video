#!/bin/bash
cd /root/.openclaw/workspace
export TAOTIE_INPUT_PATH=/root/.openclaw/workspace/stories/taotie-ep01-input.json
node --expose-gc --max-old-space-size=6144 app/cli.js preproduction
