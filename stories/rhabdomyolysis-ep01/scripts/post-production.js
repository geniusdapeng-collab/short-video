#!/usr/bin/env node
/**
 * 【横纹肌溶解EP01】后期制作管线
 * 合并镜头 + 调色 + 字幕烧录 + TTS解说
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const fss = require('fs');
const path = require('path');

const STORY_ID = 'rhabdomyolysis-ep01';
const WORK_DIR = path.join(__dirname, '..');
const SHOTS_DIR = path.join(WORK_DIR, 'production', 'shots');
const FINAL_DIR = path.join(WORK_DIR, 'production', 'final');
const TEMP_DIR = path.join(WORK_DIR, 'production', 'temp');

// 字幕文案
// v4: 合成已包含字幕，后期不再单独生成SRT和烧录字幕
// 保留文案供参考，不再用于字幕生成
const SUBTITLES = [
  { start: 0, end: 7, text: "大家好，我是护士小陈。今天讲一个听起来吓人、但其实很多人都能遇上的问题——横纹肌溶解。" },
  { start: 7, end: 13, text: "我请了一位特殊助教——山海经里的毕方。看它现在这红羽毛、站得多稳，这就是健康的肌肉状态。" },
  { start: 13, end: 20, text: "但当肌肉剧烈运动或者被挤压后，肌细胞会溶解破裂，里面的物质会跑到血液里——这就是横纹肌溶解的本质。" },
  { start: 20, end: 27, text: "这是最典型的信号——你的尿会变成茶色，甚至酱油色。这说明肌细胞里的肌红蛋白已经漏出来了，肾脏正在拼命过滤！" },
  { start: 27, end: 33, text: "同时肌肉会又肿又痛，浑身没劲儿，就像毕方现在这样，站都站不稳，翅膀都抬不起来。" },
  { start: 33, end: 39, text: "如果不及时就医，这些物质会堵住肾脏，导致急性肾损伤——非常严重！所以一旦出现这些症状，千万别硬扛！" },
  { start: 39, end: 45, text: "记住这三个信号：肌肉剧痛肿胀、尿液变茶色、全身无力。一旦出现，立刻去医院！" },
  { start: 45, end: 51, text: "很多人觉得休息休息就好了，但横纹肌溶解不行——它进展很快，必须去医院做血液和尿液检查。" },
  { start: 51, end: 59, text: "所以记住——关注身体信号，一旦出现这三个症状，别犹豫，去医院！下一集，我给大家讲为什么会发生横纹肌溶解，敬请期待！" }
];

// 确保目录存在
if (!fss.existsSync(FINAL_DIR)) fss.mkdirSync(FINAL_DIR, { recursive: true });
if (!fss.existsSync(TEMP_DIR)) fss.mkdirSync(TEMP_DIR, { recursive: true });

// 生成SRT字幕文件
function generateSRT() {
  let srt = '';
  let index = 1;
  
  for (const sub of SUBTITLES) {
    const startTime = formatTime(sub.start);
    const endTime = formatTime(sub.end);
    
    srt += `${index}\n`;
    srt += `${startTime} --> ${endTime}\n`;
    srt += `${sub.text}\n\n`;
    index++;
  }
  
  return srt;
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = 0;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

// 后期制作主流程
// v4: 合成已包含字幕，后期仅合并镜头，输出单版成片
async function main() {
  console.log('🎬 开始后期制作...');
  console.log('   v4: 合成已包含字幕，后期不再单独添加字幕');
  
  // 1. 合并所有镜头（使用ffmpeg concat）
  const concatList = path.join(TEMP_DIR, 'concat.txt');
  const shotFiles = ['S01.mp4', 'S02.mp4', 'S03.mp4', 'S04.mp4', 'S05.mp4', 'S06.mp4', 'S07.mp4', 'S08.mp4', 'S09.mp4']
    .map(f => path.join(SHOTS_DIR, f))
    .filter(f => fss.existsSync(f));
  
  if (shotFiles.length === 0) {
    throw new Error('没有找到镜头文件！');
  }
  
  // 写入concat列表
  const concatContent = shotFiles.map(f => `file '${f}'`).join('\n');
  fss.writeFileSync(concatList, concatContent);
  
  // 合并（不做重编码，快）
  const finalPath = path.join(FINAL_DIR, '横纹肌溶解-EP01-成片.mp4');
  console.log('🔄 合并镜头...');
  execSync(`ffmpeg -y -f concat -safe 0 -i "${concatList}" -c copy "${finalPath}"`, { stdio: 'inherit' });
  console.log('✅ 镜头合并完成');
  
  // 2. 输出生产报告
  console.log('✅ 纯净版生成完成');
  
  // 2. 输出生产报告
  const stats = fss.statSync(finalPath);
  const report = {
    storyId: STORY_ID,
    title: '什么是横纹肌溶解',
    completedAt: new Date().toISOString(),
    totalShots: shotFiles.length,
    duration: '59秒',
    resolution: '1920x1080',
    finalFile: finalPath,
    fileSize: `${(stats.size / 1024 / 1024).toFixed(1)}MB`,
    note: 'v4: 合成已包含字幕，后期仅合并镜头，输出单版成片'
  };
  
  fss.writeFileSync(
    path.join(FINAL_DIR, 'production-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n🏁 后期制作完成！');
  console.log(`📁 成片文件: ${finalPath}`);
  console.log(`📊 文件大小: ${report.fileSize}`);
  console.log(`⏱️ 时长: ${report.duration}`);
  console.log(`   v4: 单版输出（合成已包含字幕）`);
}

main().catch(err => {
  console.error('💥 后期制作失败:', err);
  process.exit(1);
});
