#!/bin/bash
# 横纹肌溶解EP01 v3 后期合并脚本

STORY_DIR="/root/.openclaw/workspace/stories/rhabdomyolysis-ep01"
SHOTS_DIR="$STORY_DIR/production/shots"
FINAL_DIR="$STORY_DIR/production/final"
TEMP_DIR="$STORY_DIR/production/temp"

mkdir -p "$FINAL_DIR" "$TEMP_DIR"

# 1. 镜头标准化（统一为1920x1080, 30fps）
echo "🎬 步骤1: 镜头标准化..."
for i in 01 02 03 04 05 06 07 08 09; do
    shot="S${i}"
    input="$SHOTS_DIR/${shot}-v3.mp4"
    output="$TEMP_DIR/${shot}-std.mp4"
    
    if [ -f "$input" ]; then
        ffmpeg -y -i "$input" -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1:1" -r 30 -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -ar 44100 "$output" 2>/dev/null
        echo "   ✅ ${shot} 标准化完成"
    else
        echo "   ❌ ${shot} 文件不存在"
    fi
done

# 2. 创建合并列表
echo ""
echo "📋 步骤2: 创建合并列表..."
CONCAT_LIST="$TEMP_DIR/concat_list.txt"
> "$CONCAT_LIST"
for i in 01 02 03 04 05 06 07 08 09; do
    shot="S${i}"
    std_file="$TEMP_DIR/${shot}-std.mp4"
    if [ -f "$std_file" ]; then
        echo "file '${std_file}'" >> "$CONCAT_LIST"
    fi
done

# 3. 合并视频（纯净版）
echo ""
echo "🎞️ 步骤3: 合并视频（纯净版）..."
PURE_OUTPUT="$FINAL_DIR/横纹肌溶解-EP01-v3-纯净版.mp4"
ffmpeg -y -f concat -safe 0 -i "$CONCAT_LIST" -c copy "$PURE_OUTPUT" 2>/dev/null

if [ -f "$PURE_OUTPUT" ]; then
    SIZE=$(du -h "$PURE_OUTPUT" | cut -f1)
    DURATION=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$PURE_OUTPUT" 2>/dev/null | cut -d. -f1)
    echo "   ✅ 纯净版完成: ${SIZE}, ${DURATION}秒"
else
    echo "   ❌ 纯净版合并失败"
fi

# 4. 字幕烧录（字幕版）
echo ""
echo "📝 步骤4: 字幕烧录..."
SUBTITLE_FILE="$STORY_DIR/production/subtitles.srt"

if [ -f "$SUBTITLE_FILE" ]; then
    FINAL_OUTPUT="$FINAL_DIR/横纹肌溶解-EP01-v3-字幕版.mp4"
    ffmpeg -y -i "$PURE_OUTPUT" -vf "subtitles=${SUBTITLE_FILE}:force_style='FontName=Noto Sans CJK SC,FontSize=28,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=3,BorderStyle=1,Alignment=2,MarginV=60'" -c:v libx264 -preset fast -crf 23 -c:a copy "$FINAL_OUTPUT" 2>/dev/null
    
    if [ -f "$FINAL_OUTPUT" ]; then
        SIZE=$(du -h "$FINAL_OUTPUT" | cut -f1)
        echo "   ✅ 字幕版完成: ${SIZE}"
    else
        echo "   ❌ 字幕烧录失败"
    fi
else
    echo "   ⚠️ 字幕文件不存在，跳过字幕烧录"
    cp "$PURE_OUTPUT" "$FINAL_DIR/横纹肌溶解-EP01-v3-字幕版.mp4"
fi

# 5. 输出报告
echo ""
echo "=" | head -c 50 | tr -d '\n'; echo ""
echo "📊 v3 后期合并报告"
echo "=" | head -c 50 | tr -d '\n'; echo ""
echo "✅ 成片文件:"
ls -lh "$FINAL_DIR"/*.mp4 | awk '{print "   " $9 " (" $5 ")"}'

# 清理临时文件（保留原始镜头）
echo ""
echo "🧹 清理临时文件..."
rm -rf "$TEMP_DIR"
echo "   ✅ 完成"
