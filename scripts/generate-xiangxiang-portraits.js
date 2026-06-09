#!/usr/bin/env node
/**
 * 香香4角度定妆照生成脚本
 * 基于Seedream 5.0，使用参考图保持五官特征一致性
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
const outputDir = '/root/.openclaw/workspace/short-video-system/characters/xiangXiang/portraits';
const refPhotoPath = '/root/.openclaw/workspace/short-video-system/characters/xiangXiang/original-photos/photo2-closeup.jpg';

// 香香核心特征（从4张照片交叉验证提取）
const XIANGXIANG_CORE = '7-month-old baby girl, big round eyes with double eyelids, chubby round baby face, small button nose, black short soft hair, innocent baby expression, natural baby skin texture, ultra photorealistic, 8K, studio portrait photography';

const NEGATIVE = 'no adult features, no mature face, no teenager, no wrinkles, no makeup, no anime, no cartoon, no 3D render, no plastic skin';

const angles = [
  {
    name: 'front',
    prompt: `Full body front view, sitting pose, looking directly at camera, gentle smile, ${XIANGXIANG_CORE}, wearing a simple light pink onesie, pure white studio background, natural soft lighting, three-point lighting, ${NEGATIVE}`
  },
  {
    name: 'threeQuarter',
    prompt: `Three-quarter portrait angle (45 degrees), sitting pose, head slightly turned to show left cheek profile, gentle smile with visible baby gums, ${XIANGXIANG_CORE}, wearing a simple light pink onesie, pure white studio background, natural soft lighting from 45-degree left, rim light, ${NEGATIVE}`
  },
  {
    name: 'side',
    prompt: `Side profile view (90 degrees), sitting pose, facing left, complete nose profile visible, small button nose with slight upturn, chubby round baby face with cute baby cheeks, ${XIANGXIANG_CORE}, wearing a simple light pink onesie, pure white studio background, natural soft lighting, strong rim light showing profile silhouette, ${NEGATIVE}`
  },
  {
    name: 'closeup',
    prompt: `Extreme close-up of face, filling the frame, front view, big round eyes with double eyelids looking at camera, chubby round baby face with adorable chubby cheeks, small button nose, slightly open mouth showing tiny baby gums, innocent curious expression, ${XIANGXIANG_CORE}, pure white studio background, natural soft lighting, macro photography style, ${NEGATIVE}`
  }
];

function postJson(url, headers, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname, port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve({ raw: data }); }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, { timeout: 60000 }, (res) => {
      if (res.statusCode === 200) {
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          const stats = fs.statSync(filepath);
          console.log(`[✅] Saved: ${path.basename(filepath)} (${(stats.size / 1024).toFixed(1)}KB)`);
          resolve(true);
        });
      } else {
        console.error(`[❌] Download failed: ${res.statusCode}`);
        resolve(false);
      }
    }).on('error', (err) => {
      console.error(`[❌] Download error:`, err.message);
      resolve(false);
    });
  });
}

async function generatePortrait(angle, base64Ref) {
  const prompt = angle.prompt;
  
  const body = {
    model: ENDPOINT,
    prompt: prompt,
    reference_image: base64Ref,  // Seedream参考图参数
    size: '2K',
    n: 1,
    response_format: 'url'
  };

  console.log(`[${angle.name}] 🎨 Generating...`);
  
  try {
    const result = await postJson(
      'https://ark.cn-beijing.volces.com/api/v3/images/generations',
      { 'Authorization': `Bearer ${API_KEY}` },
      body
    );
    
    if (result.error) {
      console.error(`[${angle.name}] ❌ API Error: ${result.error.code}: ${result.error.message}`);
      return { success: false, error: result.error, angle: angle.name };
    }
    
    if (result.data && result.data[0] && result.data[0].url) {
      console.log(`[${angle.name}] ✅ Generated!`);
      return { success: true, url: result.data[0].url, angle: angle.name };
    } else {
      console.error(`[${angle.name}] ❌ Unexpected response:`, JSON.stringify(result).substring(0, 200));
      return { success: false, error: 'No URL in response', angle: angle.name };
    }
  } catch (err) {
    console.error(`[${angle.name}] ❌ Exception:`, err.message);
    return { success: false, error: err.message, angle: angle.name };
  }
}

async function main() {
  console.log('🎨 香香定妆照生成启动！\n');

  // 读取参考照片
  console.log('📸 读取参考照片...');
  const refBuffer = fs.readFileSync(refPhotoPath);
  const base64Ref = refBuffer.toString('base64');
  console.log(`✅ 参考照片: ${(refBuffer.length / 1024).toFixed(1)}KB\n`);

  // 确保输出目录存在
  fs.mkdirSync(outputDir, { recursive: true });

  // 串行生成4个角度（避免并发问题）
  for (const angle of angles) {
    console.log(`\n🔥 生成 ${angle.name} 角度...`);
    const result = await generatePortrait(angle, base64Ref);
    
    if (result.success) {
      const filepath = path.join(outputDir, `xiangXiang-${angle.name}.png`);
      await downloadImage(result.url, filepath);
    } else {
      console.error(`❌ ${angle.name} 生成失败`);
    }
    
    // 等待2秒避免速率限制
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n✅ 全部完成！');
  
  // 列出结果
  const files = fs.readdirSync(outputDir);
  console.log('\n📁 生成文件:');
  files.forEach(f => {
    const stats = fs.statSync(path.join(outputDir, f));
    console.log(`  ${f} (${(stats.size / 1024).toFixed(1)}KB)`);
  });
}

main().catch(console.error);
