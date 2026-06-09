/**
 * 【强制横屏渲染脚本】Seedance 2.0 直接API渲染 v5.1
 * 
 * 核心特性：
 * 1. ratio: "16:9" 强制写入，不可绕过
 * 2. 【v5.1新增】PortraitGuard 定妆照硬拦截（双系列通用）
 * 3. 多层校验机制，遗漏即报错
 */

const https = require('https');
const fs = require('fs').promises;
const fss = require('fs');
const path = require('path');
const { PortraitGuard } = require('../../../systems/portrait-guard.js');

// ========== 配置（不可修改） ==========
const ENDPOINT = 'ep-m-20260518003302-245xb';  // Seedance 2.0 预置接入点
const API_KEY = process.env.VOLCENGINE_ARK_API_KEY || process.env.API_KEY;

// ========== 强制横屏常量（绝对不可修改） ==========
const MANDATORY_RATIO = '16:9';  // 强制横屏
const MANDATORY_WIDTH = 1280;     // 横屏宽度
const MANDATORY_HEIGHT = 720;     // 横屏高度

// ========== 校验函数 ==========

/**
 * 校验1：Prompts文件中的ratio字段
 */
function validatePromptsRatio(prompts) {
  console.log('\n🔒 校验层1: Prompts文件中的ratio字段...');
  
  for (const shot of prompts) {
    if (!shot.ratio) {
      throw new Error(`❌ ${shot.id}: prompts.json 中缺少 ratio 字段！`);
    }
    if (shot.ratio !== MANDATORY_RATIO) {
      throw new Error(`❌ ${shot.id}: prompts.json 中 ratio="${shot.ratio}"，必须是 "${MANDATORY_RATIO}"！`);
    }
  }
  
  console.log(`  ✅ 全部 ${prompts.length} 镜 ratio="${MANDATORY_RATIO}"`);
}

/**
 * 校验2：API Payload构建时的ratio
 */
function validatePayloadRatio(payload, shotId) {
  console.log(`\n🔒 校验层2: API Payload ratio (${shotId})...`);
  
  if (!payload.ratio) {
    throw new Error(`❌ ${shotId}: API payload 中缺少 ratio 字段！`);
  }
  if (payload.ratio !== MANDATORY_RATIO) {
    throw new Error(`❌ ${shotId}: API payload 中 ratio="${payload.ratio}"，必须是 "${MANDATORY_RATIO}"！`);
  }
  
  console.log(`  ✅ ${shotId} payload ratio="${MANDATORY_RATIO}"`);
}

/**
 * 校验3：构建payload前的最终检查
 */
function finalRatioCheck() {
  console.log('\n🔒 校验层3: 最终横屏确认...');
  
  // 确认常量未被篡改
  if (MANDATORY_RATIO !== '16:9') {
    throw new Error('❌ MANDATORY_RATIO 常量被篡改！');
  }
  
  console.log(`  ✅ 强制横屏常量锁定: ratio="${MANDATORY_RATIO}"`);
  console.log(`  ✅ 目标分辨率: ${MANDATORY_WIDTH}x${MANDATORY_HEIGHT}`);
}

// ========== API 调用 ==========

function submitTask(prompt, referenceImages, duration, shotId, characters) {
  return new Promise((resolve, reject) => {
    // 构建content数组
    const content = [
      { type: 'text', text: prompt }
    ];
    
    // 添加参考图
    for (const imgPath of referenceImages) {
      if (fss.existsSync(imgPath)) {
        const base64 = fss.readFileSync(imgPath).toString('base64');
        content.push({
          type: 'image_url',
          image_url: { url: `data:image/png;base64,${base64}` },
          role: 'reference_image'
        });
      }
    }

    // 【v5.1新增】PortraitGuard 实时硬拦截检查
    if (characters && characters.length > 0) {
      const liveCheck = PortraitGuard.quickCheck(content, characters);
      if (!liveCheck.passed) {
        const errorMsg = liveCheck.characterChecks
          .filter(c => !c.passed)
          .map(c => `[${c.characterId}] ${c.issues.join(', ')}`)
          .join('; ');
        reject(new Error(`❌ 镜头 ${shotId} 定妆照硬拦截: ${errorMsg}`));
        return;
      }
    }
    
    // 构建payload（ratio强制写入）
    const payload = {
      model: ENDPOINT,
      content: content,
      ratio: MANDATORY_RATIO,  // 强制横屏！不可绕过
      duration: duration
    };
    
    // 校验层2：payload ratio检查
    validatePayloadRatio(payload, shotId);
    
    const data = JSON.stringify(payload);
    
    const options = {
      hostname: 'ark.cn-beijing.volces.com',
      port: 443,
      path: '/api/v3/contents/generations/tasks',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve(result);
        } catch (e) {
          reject(new Error(`API响应解析失败: ${responseData}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ========== 主流程 ==========

async function main() {
  console.log('========================================');
  console.log('🎬 强制横屏渲染系统 v5.0');
  console.log('========================================');
  
  // 检查API Key
  if (!API_KEY || !API_KEY.startsWith('ark-')) {
    console.error('❌ 错误: API_KEY格式不正确或缺失');
    console.error('   需要 VOLCENGINE_ARK_API_KEY 或 API_KEY 环境变量');
    console.error('   格式: ark-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
    process.exit(1);
  }
  
  // 读取prompts
  const PROJECT_DIR = '/root/.openclaw/workspace/stories/rhabdomyolysis-s01e01';
  const promptsPath = path.join(PROJECT_DIR, 'production', 'prompts.json');
  
  if (!fss.existsSync(promptsPath)) {
    console.error(`❌ 未找到 prompts.json: ${promptsPath}`);
    process.exit(1);
  }
  
  const prompts = JSON.parse(fss.readFileSync(promptsPath, 'utf8'));
  console.log(`\n📋 读取到 ${prompts.length} 镜`);
  
  // 校验层1：prompts中的ratio
  validatePromptsRatio(prompts);
  
  // 校验层3：最终确认
  finalRatioCheck();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ 全部横屏校验通过！开始渲染...');
  console.log('='.repeat(50));
  
  // 逐镜渲染
  const results = [];
  
  for (let i = 0; i < prompts.length; i++) {
    const shot = prompts[i];
    console.log(`\n🎬 [${i+1}/${prompts.length}] ${shot.id} - ${shot.type}`);
    console.log(`   Prompt: ${shot.promptLength}字 | Duration: ${shot.duration}秒 | Ratio: ${shot.ratio}`);
    
    try {
      // 读取角色参考图
      const refImages = [];
      for (const charId of shot.characters) {
        const charCardPath = path.join(PROJECT_DIR, '..', '..', 'characters', charId, 'character-card.json');
        if (fss.existsSync(charCardPath)) {
          const charCard = JSON.parse(fss.readFileSync(charCardPath, 'utf8'));
          const portraits = charCard.generatedAssets?.referenceImages || [];
          for (const imgPath of portraits) {
            const fullPath = path.join(PROJECT_DIR, '..', '..', imgPath);
            if (fss.existsSync(fullPath)) {
              refImages.push(fullPath);
            }
          }
        }
      }
      
      // 去重
      const uniqueRefs = [...new Set(refImages)];
      console.log(`   参考图: ${uniqueRefs.length}张`);
      
      // 提交渲染（ratio已在submitTask中强制写入）
      const result = await submitTask(shot.prompt, uniqueRefs, shot.duration, shot.id, shot.characters);
      
      if (result.id) {
        console.log(`   ✅ 提交成功: taskId=${result.id}`);
        results.push({ id: shot.id, taskId: result.id, status: 'submitted' });
      } else {
        console.log(`   ❌ 提交失败: ${JSON.stringify(result)}`);
        results.push({ id: shot.id, error: result, status: 'failed' });
      }
      
      // 间隔3秒避免限流
      if (i < prompts.length - 1) {
        await new Promise(r => setTimeout(r, 3000));
      }
      
    } catch (error) {
      console.error(`   ❌ ${shot.id} 错误: ${error.message}`);
      results.push({ id: shot.id, error: error.message, status: 'error' });
    }
  }
  
  // 保存结果
  const resultPath = path.join(PROJECT_DIR, 'production', 'render-result.json');
  fss.writeFileSync(resultPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    ratio: MANDATORY_RATIO,
    shots: results
  }, null, 2));
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 渲染提交完成');
  console.log(`总镜头: ${prompts.length}`);
  console.log(`成功: ${results.filter(r => r.status === 'submitted').length}`);
  console.log(`失败: ${results.filter(r => r.status === 'failed' || r.status === 'error').length}`);
  console.log(`强制横屏: ${MANDATORY_RATIO} ✅`);
  console.log('='.repeat(50));
}

main().catch(console.error);
