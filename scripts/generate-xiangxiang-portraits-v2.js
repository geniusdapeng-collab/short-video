#!/usr/bin/env node
/**
 * 香香4角度定妆照生成脚本 v2 - 优化版
 * 每个角度使用最合适的原始照片作为参考图
 * 更精确特征提取，增强身份一致性
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
const photosDir = '/root/.openclaw/workspace/short-video-system/characters/xiangXiang/original-photos';

// 更精确的香香特征（从4张照片深度分析提取）
const XIANGXIANG_PRECISE = 'exact same baby girl from reference photo, maintain identical facial features, big round dark eyes with visible double eyelids, small low flat nose with rounded tip, chubby round baby face with prominent baby cheeks, small full lips, pinkish fair skin, short black soft hair with natural texture, innocent baby expression, 7 months old, ultra photorealistic, identical to reference';

const NEGATIVE = 'no different person, no adult face, no teenager, no wrinkles, no makeup, no anime, no cartoon, no 3D render, no plastic skin, no altered facial features, maintain exact identity from reference photo';

const STYLE = 'professional studio portrait, pure white background, natural soft three-point lighting, 8K, photorealistic, high detail skin texture';

// 4个角度配置，每个匹配最合适的参考图
const angles = [
  {
    name: 'front',
    refPhoto: 'photo1-front.jpg', // 正面全身坐姿
    prompt: `Full body front view, sitting pose, looking directly at camera, gentle smile, ${XIANGXIANG_PRECISE}, wearing a simple light pink onesie, ${STYLE}, ${NEGATIVE}`
  },
  {
    name: 'threeQuarter',
    refPhoto: 'photo3-threeQuarter.jpg', // 偏角度带笑容
    prompt: `Three-quarter portrait angle (45 degrees), sitting pose, head slightly turned to show left cheek profile, gentle smile with visible baby gums, ${XIANGXIANG_PRECISE}, wearing a simple light pink onesie, ${STYLE}, ${NEGATIVE}`
  },
  {
    name: 'side',
    refPhoto: 'photo2-closeup.jpg', // 五官最清晰，AI生成侧面轮廓
    prompt: `Side profile view (90 degrees), sitting pose, facing left, complete nose profile visible, small rounded nose with slight upturn, chubby round baby face with cute baby cheeks, ${XIANGXIANG_PRECISE}, wearing a simple light pink onesie, ${STYLE}, strong rim light showing profile silhouette, ${NEGATIVE}`
  },
  {
    name: 'closeup',
    refPhoto: 'photo2-closeup.jpg', // 正面特写五官最清晰
    prompt: `Extreme close-up of face, filling the frame, front view, big round dark eyes with double eyelids looking at camera, chubby round baby face with adorable chubby cheeks, small rounded nose, slightly open mouth showing tiny baby gums, innocent curious expression, ${XIANGXIANG_PRECISE}, ${STYLE}, macro photography style, ${NEGATIVE}`
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

async function generatePortrait(angle) {
  // 读取对应参考图
  const refPath = path.join(photosDir, angle.refPhoto);
  if (!fs.existsSync(refPath)) {
    console.error(`[${angle.name}] ❌ Reference photo not found: ${refPath}`);
    return { success: false, error: 'Reference photo not found', angle: angle.name };
  }
  
  const refBuffer = fs.readFileSync(refPath);
  const base64Ref = refBuffer.toString('base64');
  console.log(`[${angle.name}] 📸 Reference: ${angle.refPhoto} (${(refBuffer.length / 1024).toFixed(1)}KB)`);
  
  const body = {
    model: ENDPOINT,
    prompt: angle.prompt,
    reference_image: base64Ref,
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
  console.log('🎨 香香定妆照生成启动 v2（优化版）！\n');
  console.log('策略：每个角度使用最合适的原始照片作为参考图\n');

  // 确保输出目录存在
  fs.mkdirSync(outputDir, { recursive: true });

  // 串行生成4个角度
  for (const angle of angles) {
    console.log(`\n🔥 生成 ${angle.name} 角度...`);
    const result = await generatePortrait(angle);
    
    if (result.success) {
      const filepath = path.join(outputDir, `xiangXiang-${angle.name}.png`);
      await downloadImage(result.url, filepath);
    } else {
      console.error(`❌ ${angle.name} 生成失败`);
    }
    
    // 等待3秒避免速率限制
    await new Promise(r => setTimeout(r, 3000));
  }

  console.log('\n✅ 全部完成！');
  
  // 列出结果
  const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.png'));
  console.log('\n📁 生成文件:');
  files.forEach(f => {
    const stats = fs.statSync(path.join(outputDir, f));
    console.log(`  ${f} (${(stats.size / 1024).toFixed(1)}KB)`);
  });
}

main().catch(console.error);
