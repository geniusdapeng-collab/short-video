#!/usr/bin/env node
/**
 * 小卓4角度定妆照生成脚本
 * 基于Seedream 5.0
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ========== API 配置 ==========
let API_KEY = process.env.VOLCENGINE_ARK_API_KEY;
if (!API_KEY) {
  try {
    const config = JSON.parse(fs.readFileSync('/root/.openclaw/config/volcengine.json', 'utf8'));
    API_KEY = config.apiKey;
  } catch {}
}
if (!API_KEY) {
  console.error('❌ 未找到 API Key');
  process.exit(1);
}

const ENDPOINT = 'ep-20260518004750-lz76f'; // Seedream 5.0
const outputDir = '/root/.openclaw/workspace/short-video-system/characters/xiaoZhuo/portraits';

// 小卓核心特征（35岁母亲，亚洲人）
const XIAOZHUO_CORE = '35-year-old Asian woman, mother, big bright eyes, full forehead, pointed chin, high nose bridge, well-proportional facial features, beautiful smile, ponytail hairstyle, gentle and warm expression, natural skin texture, ultra photorealistic, 8K, studio portrait photography';

const NEGATIVE = 'no anime, no cartoon, no 3D render, no plastic skin, no ugly, no disfigured';

const angles = [
  {
    name: 'front',
    prompt: `Full body front view, standing pose, natural smile, facing camera, ${XIAOZHUO_CORE}, wearing casual comfortable beachwear, pure white studio background, natural soft lighting, three-point lighting, ${NEGATIVE}`
  },
  {
    name: 'threeQuarter',
    prompt: `Three-quarter portrait angle (45 degrees), standing pose, head slightly turned to show left cheek profile, gentle smile, ${XIAOZHUO_CORE}, ponytail hairstyle visible, wearing casual comfortable beachwear, pure white studio background, natural soft lighting from 45-degree left, rim light, ${NEGATIVE}`
  },
  {
    name: 'side',
    prompt: `Side profile view (90 degrees), standing pose, facing left, complete nose profile visible, high nose bridge, pointed chin silhouette, ${XIAOZHUO_CORE}, ponytail hairstyle clearly visible, wearing casual comfortable beachwear, pure white studio background, natural soft lighting, strong rim light showing profile silhouette, ${NEGATIVE}`
  },
  {
    name: 'closeup',
    prompt: `Close-up of face, front view, filling the frame, big bright eyes looking at camera, full forehead, high nose bridge, well-proportional beautiful features, gentle motherly smile, warm expression, ${XIAOZHUO_CORE}, pure white studio background, natural soft lighting, macro photography style, ${NEGATIVE}`
  }
];

async function generateWithArk(prompt, outputPath) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: ENDPOINT,
      prompt: prompt,
      size: '1920x1920',
      quality: 'high',
      n: 1
    });

    const options = {
      hostname: 'ark.cn-beijing.volces.com',
      path: '/api/v3/images/generations',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Length': Buffer.byteLength(data)
      },
      timeout: 120000
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(responseData);
          if (json.data?.[0]?.url) {
            resolve(json.data[0].url);
          } else if (json.error) {
            reject(new Error(`API错误: ${JSON.stringify(json.error)}`));
          } else {
            reject(new Error(`未知响应: ${responseData.substring(0, 200)}`));
          }
        } catch (e) {
          reject(new Error(`解析失败: ${e.message} | 原始: ${responseData.substring(0, 200)}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => reject(new Error('请求超时')));
    req.write(data);
    req.end();
  });
}

async function downloadImage(url, outputPath) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 30000 }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`下载失败: ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        fs.writeFileSync(outputPath, buffer);
        resolve(buffer.length);
      });
    }).on('error', reject);
  });
}

async function main() {
  // 确保目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('🎬 小卓角色定妆照生成开始');
  console.log(`👩 角色: 小卓（香香妈妈）`);
  console.log(`📸 角度: ${angles.map(a => a.name).join(', ')}\n`);

  const results = [];
  for (const angle of angles) {
    try {
      console.log(`[${angle.name}] 生成 ${angle.desc}...`);
      
      const imageUrl = await generateWithArk(angle.prompt, path.join(outputDir, `xiaoZhuo-${angle.name}.png`));
      await downloadImage(imageUrl, path.join(outputDir, `xiaoZhuo-${angle.name}.png`));
      
      const sizeKB = (fs.statSync(path.join(outputDir, `xiaoZhuo-${angle.name}.png`)).size / 1024).toFixed(1);
      console.log(`[${angle.name}] ✅ 生成成功！(${sizeKB}KB)`);
      results.push({ angle: angle.name, success: true });
      
      // 间隔1秒
      if (angle !== angles[angles.length - 1]) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (err) {
      console.error(`[${angle.name}] ❌ 错误: ${err.message}`);
      results.push({ angle: angle.name, success: false, error: err.message });
    }
  }

  console.log('\n📊 生成结果汇总:');
  const successCount = results.filter(r => r.success).length;
  console.log(`✅ 成功: ${successCount}/${angles.length}`);
  
  results.forEach(r => {
    if (r.success) {
      console.log(`  ✅ ${r.angle}`);
    } else {
      console.log(`  ❌ ${r.angle}: ${r.error}`);
    }
  });

  if (successCount === angles.length) {
    console.log('\n🎉 所有定妆照生成成功！');
  } else {
    console.log(`\n⚠️ 有 ${angles.length - successCount} 个角度生成失败，需要重试`);
  }
}

main();
