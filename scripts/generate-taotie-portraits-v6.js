#!/usr/bin/env node
/**
 * 饕餮4角度定妆照生成 — v6.2 Nirath风格
 * front / threeQuarter / closeup / side
 */

const https = require('https');
const fs = require('fs');

const ENDPOINT = '003cENDPOINT_IMG003e'; // Seedream 5.0接入点
// 自动读取API Key（从环境变量或配置文件）
let API_KEY = process.env.VOLCENGINE_ARK_API_KEY;
if (!API_KEY) {
  try {
    const config = JSON.parse(fs.readFileSync('/root/.openclaw/config/volcengine.json', 'utf8'));
    API_KEY = config.apiKey || config.arkApiKey;
  } catch {}
}
if (!API_KEY) {
  console.error('❌ 未找到 API Key。请设置 VOLCENGINE_ARK_API_KEY 环境变量或配置 ~/.openclaw/config/volcengine.json');
  process.exit(1);
}

const outputDir = '/root/.openclaw/workspace/characters/taoTie/portraits';
fs.mkdirSync(outputDir, { recursive: true });

// Nirath风格关键词（v6.2标准）
const NIRATH_STYLE = 'photorealistic cinematic, bright fantasy atmosphere, dual-sunset lighting with rose-gold and amber tones, bioluminescent ecosystem fill light, volumetric light rays, IMAX epic scale, alien planet Nirath';

// 负面约束（v6.2标准）
const NEGATIVE = 'no metallic shine, no Unreal Engine, no Lumen, no Nanite, no 3D render label, no traditional Chinese symbols, natural eye colors only, no blue eyes, no red eyes';

// 饕餮视觉锚定（文字锚定，非人类角色）
const TAOTIE_CORE = 'TaoTie beast from Nirath planet, sheep-like body with human-like face, shoulder height 30 meters, volcanic rock armor covering entire body, giant mouth occupying two-thirds of the face, two sulfur-yellow eyes growing under the armpits, tiger teeth and human claws';

const angles = [
  {
    name: 'front',
    prompt: `Full body front view, ${TAOTIE_CORE}, standing in majestic pose on Nirath alien terrain, volcanic rock armor with deep cracks revealing magma-like bioluminescent orange glow from within, ${NIRATH_STYLE}, ${NEGATIVE}, pure white background, studio three-point lighting, 2K resolution, character reference sheet`
  },
  {
    name: 'threeQuarter',
    prompt: `Three-quarter portrait angle, ${TAOTIE_CORE}, classic cinematic portrait angle showing depth and dimension, volcanic rock armor texture detail visible, bioluminescent orange glow pulsing through armor cracks, ${NIRATH_STYLE}, ${NEGATIVE}, pure white background, main light from 45-degree left, rim light highlighting volcanic armor edges, 2K resolution, character reference sheet`
  },
  {
    name: 'closeup',
    prompt: `Extreme close-up of face and upper body, ${TAOTIE_CORE}, focus on the terrifying giant mouth occupying two-thirds of the face, two sulfur-yellow vertical pupils under armpits glowing with inner fire, volcanic rock armor texture with magma-bioluminescent veins, expression of eternal hunger and rage, ${NIRATH_STYLE}, ${NEGATIVE}, pure white background, dramatic front key light filling the mouth interior, subsurface scattering showing magma glow through skin, 2K resolution, character reference sheet`
  },
  {
    name: 'side',
    prompt: `Full body side profile, ${TAOTIE_CORE}, 90-degree side view showing full silhouette, streamlined sheep-like body contour beneath volcanic armor, short thick tail with bioluminescent orange tip, front tiger claws and rear sheep hooves visible, 30-meter shoulder height massive scale, ${NIRATH_STYLE}, ${NEGATIVE}, pure white background, strong rim light emphasizing the 30-meter beast silhouette, atmospheric perspective showing scale, 2K resolution, character reference sheet`
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
    https.get(url, (res) => {
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(filepath); });
    }).on('error', reject);
  });
}

async function generateAngle(angle) {
  console.log(`[${new Date().toLocaleTimeString('zh-CN')}] ⏳ 生成 ${angle.name}...`);
  const start = Date.now();
  try {
    const body = {
      model: ENDPOINT,
      prompt: angle.prompt,
      size: '2K',
      n: 1,
      response_format: 'url'
    };
    const response = await postJson(
      'https://ark.cn-beijing.volces.com/api/v3/images/generations',
      { 'Authorization': `Bearer ${API_KEY}` },
      body
    );
    
    if (response.error) throw new Error(`${response.error.code}: ${response.error.message}`);
    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) throw new Error('No image URL returned');
    
    const filepath = `${outputDir}/taotie-${angle.name}.png`;
    await downloadImage(imageUrl, filepath);
    const elapsed = Date.now() - start;
    console.log(`[${new Date().toLocaleTimeString('zh-CN')}] ✅ ${angle.name} 完成 | ${elapsed}ms | ${filepath}`);
    return { name: angle.name, success: true, filepath, url: imageUrl, elapsed };
  } catch (err) {
    const elapsed = Date.now() - start;
    console.log(`[${new Date().toLocaleTimeString('zh-CN')}] ❌ ${angle.name} 失败 | ${elapsed}ms | ${err.message}`);
    return { name: angle.name, success: false, error: err.message, elapsed };
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🎨 饕餮4角度定妆照生成 — v6.2 Nirath风格');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`API接入点: ${ENDPOINT}`);
  console.log(`输出目录: ${outputDir}`);
  console.log(`角度: ${angles.map(a => a.name).join(', ')}`);
  console.log('');
  
  // 串行生成（避免并发限制）
  const results = [];
  for (const angle of angles) {
    results.push(await generateAngle(angle));
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 生成结果');
  console.log('═══════════════════════════════════════════════════════════════');
  let successCount = 0;
  for (const r of results) {
    const icon = r.success ? '✅' : '❌';
    console.log(`${icon} ${r.name}: ${r.success ? r.filepath : r.error} (${r.elapsed}ms)`);
    if (r.success) successCount++;
  }
  console.log(`\n总计: ${successCount}/${angles.length} 成功`);
  
  // 保存元数据
  const meta = {
    character: 'taoTie',
    generatedAt: new Date().toISOString(),
    model: ENDPOINT,
    style: 'v6.2 Nirath bright fantasy',
    angles: results.map(r => ({
      name: r.name,
      success: r.success,
      filepath: r.filepath || null,
      url: r.url || null,
      elapsed: r.elapsed,
      error: r.error || null
    }))
  };
  fs.writeFileSync(`${outputDir}/generation-meta.json`, JSON.stringify(meta, null, 2));
  console.log(`\n📁 元数据已保存: ${outputDir}/generation-meta.json`);
}

main().catch(e => {
  console.error('❌ 致命错误:', e.message);
  process.exit(1);
});
