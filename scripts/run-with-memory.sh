#!/bin/bash
# 包装脚本：运行预生产
# v6.5.25: 不限制堆大小，使用Node默认值，让V8更积极GC
rm -f /root/.openclaw/workspace/output/rhabdomyolysis-ep01-preproduction.json
node --expose-gc /root/.openclaw/workspace/scripts/run-health-edu-preproduction.js
