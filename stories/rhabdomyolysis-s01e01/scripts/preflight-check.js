/**
 * 【渲染前强制校验脚本】v1.0
 * 
 * 在提交渲染前执行，校验所有关键参数：
 * 1. ✅ ratio 必须为 "16:9"
 * 2. ✅ 所有prompt字数 ≤ 490
 * 3. ✅ duration 有效
 * 4. ✅ 角色参考图存在
 * 
 * 任何校验失败即终止，绝不提交！
 */

const fs = require('fs').promises;
const fss = require('fs');
const path = require('path');

const PROJECT_DIR = '/root/.openclaw/workspace/stories/rhabdomyolysis-s01e01';
const MANDATORY_RATIO = '16:9';
const MAX_CHARS = 490;

function runPreflightChecks() {
  console.log('========================================');
  console.log('🛡️ 渲染前强制校验 v1.0');
  console.log('========================================\n');
  
  let errors = 0;
  let warnings = 0;
  
  // 1. 读取prompts
  const promptsPath = path.join(PROJECT_DIR, 'production', 'prompts.json');
  if (!fss.existsSync(promptsPath)) {
    console.error('❌ 致命错误: prompts.json 不存在！');
    return { passed: false, errors: 1 };
  }
  
  const prompts = JSON.parse(fss.readFileSync(promptsPath, 'utf8'));
  console.log(`📋 读取到 ${prompts.length} 镜\n`);
  
  // 2. 横屏校验（最高优先级）
  console.log('🔒 校验1: 强制横屏检查');
  console.log(`   目标比例: ${MANDATORY_RATIO}`);
  
  for (const shot of prompts) {
    // 检查ratio字段存在
    if (!shot.ratio) {
      console.error(`   ❌ ${shot.id}: 缺少 ratio 字段！`);
      errors++;
      continue;
    }
    
    // 检查ratio值正确
    if (shot.ratio !== MANDATORY_RATIO) {
      console.error(`   ❌ ${shot.id}: ratio="${shot.ratio}"，必须为 "${MANDATORY_RATIO}"！`);
      errors++;
      continue;
    }
    
    console.log(`   ✅ ${shot.id}: ratio="${shot.ratio}"`);
  }
  
  // 3. Prompt字数校验
  console.log('\n🔒 校验2: Prompt字数检查');
  console.log(`   上限: ${MAX_CHARS}字`);
  
  for (const shot of prompts) {
    if (shot.promptLength > MAX_CHARS) {
      console.error(`   ❌ ${shot.id}: ${shot.promptLength}字 > ${MAX_CHARS}字上限！`);
      errors++;
    } else {
      console.log(`   ✅ ${shot.id}: ${shot.promptLength}字`);
    }
  }
  
  // 4. Duration校验
  console.log('\n🔒 校验3: Duration有效性检查');
  
  for (const shot of prompts) {
    if (!shot.duration || shot.duration <= 0) {
      console.error(`   ❌ ${shot.id}: duration=${shot.duration} 无效！`);
      errors++;
    } else if (shot.duration > 12) {
      console.warn(`   ⚠️  ${shot.id}: duration=${shot.duration}秒 > 12秒，API可能不支持`);
      warnings++;
    } else {
      console.log(`   ✅ ${shot.id}: ${shot.duration}秒`);
    }
  }
  
  // 5. 角色参考图校验
  console.log('\n🔒 校验4: 角色参考图存在性检查');
  
  for (const shot of prompts) {
    for (const charId of shot.characters) {
      const charCardPath = path.join(PROJECT_DIR, '..', '..', 'characters', charId, 'character-card.json');
      
      if (!fss.existsSync(charCardPath)) {
        console.error(`   ❌ ${shot.id}: 角色档案 ${charId} 不存在！`);
        errors++;
        continue;
      }
      
      const charCard = JSON.parse(fss.readFileSync(charCardPath, 'utf8'));
      const portraits = charCard.generatedAssets?.referenceImages || [];
      
      if (portraits.length === 0) {
        console.error(`   ❌ ${shot.id}: 角色 ${charId} 没有定妆照！`);
        errors++;
        continue;
      }
      
      // 检查文件存在
      let missing = 0;
      for (const imgPath of portraits) {
        const fullPath = path.join(PROJECT_DIR, '..', '..', imgPath);
        if (!fss.existsSync(fullPath)) {
          missing++;
        }
      }
      
      if (missing > 0) {
        console.warn(`   ⚠️  ${shot.id}: 角色 ${charId} 有 ${missing} 张定妆照缺失`);
        warnings++;
      } else {
        console.log(`   ✅ ${shot.id}: 角色 ${charId} ${portraits.length}张定妆照就绪`);
      }
    }
  }
  
  // 6. 台词字数校验（与duration匹配）
  console.log('\n🔒 校验5: 台词与时长匹配检查');
  
  for (const shot of prompts) {
    const narrationChars = shot.narration?.length || 0;
    const minDuration = Math.ceil(narrationChars / 5.0); // 最快5字/秒
    
    if (shot.duration < minDuration) {
      console.warn(`   ⚠️  ${shot.id}: ${narrationChars}字台词需${minDuration}秒 > 分配${shot.duration}秒，可能说不完`);
      warnings++;
    } else {
      console.log(`   ✅ ${shot.id}: ${narrationChars}字/${shot.duration}秒`);
    }
  }
  
  // 汇总
  console.log('\n' + '='.repeat(50));
  console.log('📊 校验报告');
  console.log('='.repeat(50));
  console.log(`总镜头: ${prompts.length}`);
  console.log(`致命错误: ${errors}`);
  console.log(`警告: ${warnings}`);
  
  if (errors === 0) {
    console.log('\n✅ 全部校验通过！允许渲染！');
    console.log(`   强制横屏: ${MANDATORY_RATIO} ✅`);
    console.log(`   最大字数: ${MAX_CHARS}字 ✅`);
    console.log('='.repeat(50));
    return { passed: true, errors: 0, warnings };
  } else {
    console.log(`\n❌ 发现 ${errors} 个致命错误！禁止渲染！`);
    console.log('   请修复错误后重新运行。');
    console.log('='.repeat(50));
    return { passed: false, errors, warnings };
  }
}

// 运行
const result = runPreflightChecks();
process.exit(result.passed ? 0 : 1);
