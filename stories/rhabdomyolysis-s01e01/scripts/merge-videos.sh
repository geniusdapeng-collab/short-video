#!/bin/bash

VIDEO_DIR="/root/.openclaw/workspace/stories/rhabdomyolysis-s01e01/production/videos"
OUTPUT="/root/.openclaw/workspace/stories/rhabdomyolysis-s01e01/production/rhabdomyolysis-ep01-final.mp4"

# 创建concat列表
CONCAT_LIST="$VIDEO_DIR/concat.txt"
echo "" > "$CONCAT_LIST"

for i in S01 S02 S03 S04 S05 S06 S07; do
    echo "file '$VIDEO_DIR/$i.mp4'" >> "$CONCAT_LIST"
done

# 使用ffmpeg合并
ffmpeg -f concat -safe 0 -i "$CONCAT_LIST" -c copy "$OUTPUT"

# 清理concat列表
rm "$CONCAT_LIST"

# 显示结果
if [ -f "$OUTPUT" ]; then
    SIZE=$(du -h "$OUTPUT" | cut -f1)
    DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$OUTPUT" | cut -d. -f1)
    echo "========================================"
    echo "✅ 合并完成!"
    echo "文件: $OUTPUT"
    echo "大小: $SIZE"
    echo "时长: ${DURATION}秒"
    echo "========================================"
else
    echo "❌ 合并失败"
fi
