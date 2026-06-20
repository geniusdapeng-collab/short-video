#!/bin/bash
echo "========================================"
echo "🎬 合并v4.4最终成片（9镜含过渡）"
echo "========================================"

cd /root/.openclaw/workspace/stories/rhabdomyolysis-s01e01

ffmpeg -f concat -safe 0 -i production/merge-v44.txt -c copy production/rhabdomyolysis-ep01-v44-final.mp4

echo ""
echo "========================================"
if [ -f "production/rhabdomyolysis-ep01-v44-final.mp4" ]; then
    SIZE=$(ls -lh production/rhabdomyolysis-ep01-v44-final.mp4 | awk '{print $5}')
    echo "✅ 合并完成: rhabdomyolysis-ep01-v44-final.mp4 ($SIZE)"
else
    echo "❌ 合并失败"
fi
echo "========================================"
