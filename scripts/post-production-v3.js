#!/usr/bin/env node
/**
 * 后期合成：重新合成完整成片（v6.2-patch90）
 * 使用新的 S04/S05 替换旧版本
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const productionDir = '/root/.openclaw/workspace/taotie-ep01-production';
const finalOutput = '/root/.openclaw/workspace/taotie-ep01-final-v3.mp4';

// 视频URL列表（v6.2-patch90）
const shotUrls = {
  'S00': 'https://ark-acg-cn-beijing.tos-cn-beijing.volces.com/doubao-seedance-2-0/02178023443621800000000000000000000ffffac17783fb1f61b.mp4?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Credential=AKLTYWJkZTExNjA1ZDUyNDc3YzhjNTM5OGIyNjBhNDcyOTQ%2F20260531%2Fcn-beijing%2Ftos%2Frequest&X-Tos-Date=20260531T133909Z&X-Tos-Expires=86400&X-Tos-Signature=7eb3f1465237c57f066bc41a161d6a69bbe699fcabae558311a0911ec03779b0&X-Tos-SignedHeaders=host',
  'S01': 'https://ark-acg-cn-beijing.tos-cn-beijing.volces.com/doubao-seedance-2-0/02178023441074000000000000000000000ffffac152ff3ebfc55.mp4?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Credential=AKLTYWJkZTExNjA1ZDUyNDc3YzhjNTM5OGIyNjBhNDcyOTQ%2F20260531%2Fcn-beijing%2Ftos%2Frequest&X-Tos-Date=20260531T133909Z&X-Tos-Expires=86400&X-Tos-Signature=7c75a8e9e993f019456cedca5d529ff5e0ec151e9a14c40f96a05bfb7de3a1c0&X-Tos-SignedHeaders=host',
  'S02': 'https://ark-acg-cn-beijing.tos-cn-beijing.volces.com/doubao-seedance-2-0/02178023442394800000000000000000000ffffac17783fb1f62d.mp4?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Credential=AKLTYWJkZTExNjA1ZDUyNDc3YzhjNTM5OGIyNjBhNDcyOTQ%2F20260531%2Fcn-beijing%2Ftos%2Frequest&X-Tos-Date=20260531T133909Z&X-Tos-Expires=86400&X-Tos-Signature=7d85f1465237c57f066bc41a161d6a69bbe699fcabae558311a0911ec03779b0&X-Tos-SignedHeaders=host',
  'S03': 'https://ark-acg-cn-beijing.tos-cn-beijing.volces.com/doubao-seedance-2-0/02178023444861000000000000000000000ffffac17783fb1f64d.mp4?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Credential=AKLTYWJkZTExNjA1ZDUyNDc3YzhjNTM5OGIyNjBhNDcyOTQ%2F20260531%2Fcn-beijing%2Ftos%2Frequest&X-Tos-Date=20260531T133909Z&X-Tos-Expires=86400&X-Tos-Signature=7f95f1465237c57f066bc41a161d6a69bbe699fcabae558311a0911ec03779b0&X-Tos-SignedHeaders=host',
  'S04': 'https://ark-acg-cn-beijing.tos-cn-beijing.volces.com/doubao-seedance-2-0/02178024646688800000000000000000000ffffac152ff3ebfc7d.mp4?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Credential=AKLTYWJkZTExNjA1ZDUyNDc3YzhjNTM5OGIyNjBhNDcyOTQ%2F20260531%2Fcn-beijing%2Ftos%2Frequest&X-Tos-Date=20260531T165753Z&X-Tos-Expires=86400&X-Tos-Signature=824aa8e9e993f019456cedca5d529ff5e0ec151e9a14c40f96a05bfb7de3a1c0&X-Tos-SignedHeaders=host',
  'S05': 'https://ark-acg-cn-beijing.tos-cn-beijing.volces.com/doubao-seedance-2-0/02178024648114600000000000000000000ffffac17783f4631a1.mp4?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Credential=AKLTYWJkZTExNjA1ZDUyNDc3YzhjNTM5OGIyNjBhNDcyOTQ%2F20260531%2Fcn-beijing%2Ftos%2Frequest&X-Tos-Date=20260531T165719Z&X-Tos-Expires=86400&X-Tos-Signature=c7a9b3f8e5bb3f118e18cd8e8306f51057272530597a552df9dafaef2989cd7b&X-Tos-SignedHeaders=host'
};

async function downloadVideo(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    https.get(url, { headers: { 'X-Tos-SignedHeaders': 'host' } }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        https.get(response.headers.location, (res) => {
          res.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        }).on('error', reject);
      } else {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }
    }).on('error', reject);
  });
}

async function main() {
  console.log('🎬 后期合成：重新合成完整成片（v6.2-patch90）\n');
  
  // 创建生产目录
  if (!fs.existsSync(productionDir)) {
    fs.mkdirSync(productionDir, { recursive: true });
  }
  
  // 下载所有视频
  const videoFiles = [];
  for (const [shotId, url] of Object.entries(shotUrls)) {
    const outputPath = path.join(productionDir, `${shotId}.mp4`);
    
    // 如果已存在则删除旧版本
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
    
    console.log(`📥 下载 ${shotId}...`);
    try {
      await downloadVideo(url, outputPath);
      const stats = fs.statSync(outputPath);
      console.log(`  ✅ ${shotId} 下载完成 (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);
      videoFiles.push(outputPath);
    } catch (e) {
      console.error(`  ❌ ${shotId} 下载失败: ${e.message}`);
      process.exit(1);
    }
  }
  
  // 创建 concat 列表文件
  const listPath = path.join(productionDir, 'concat-list.txt');
  const listContent = videoFiles.map(f => `file '${f}'`).join('\n');
  fs.writeFileSync(listPath, listContent);
  
  // 使用 ffmpeg 合并
  console.log('\n🎞️ 合并所有镜头...');
  const ffmpegCmd = `ffmpeg -f concat -safe 0 -i "${listPath}" -c copy "${finalOutput}" -y`;
  
  try {
    execSync(ffmpegCmd, { stdio: 'inherit' });
    
    const stats = fs.statSync(finalOutput);
    console.log(`\n✅ 成片合成完成！`);
    console.log(`📁 文件: ${finalOutput}`);
    console.log(`📦 大小: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
    
    // 获取视频信息
    const ffprobeCmd = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration -of csv=s=x:p=0 "${finalOutput}"`;
    const info = execSync(ffprobeCmd, { encoding: 'utf8' }).trim();
    console.log(`📊 信息: ${info}`);
    
  } catch (e) {
    console.error('\n❌ 合并失败:', e.message);
    process.exit(1);
  }
}

main().catch(e => {
  console.error('❌ 失败:', e);
  process.exit(1);
});
