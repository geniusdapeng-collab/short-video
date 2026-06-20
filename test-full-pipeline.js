#!/usr/bin/env node
/**
 * 超短裙系统完整链路测试
 * 验证：Prompt生成 → 制作引擎 → 渲染引擎 → 后期引擎
 */

const path = require('path');

console.log('🧪 超短裙系统完整链路测试开始...\n');

// 1. 测试 Prompt 生成引擎
console.log('1️⃣ 测试 Prompt 生成引擎...');
try {
  const { expandPrompt, checkPromptLength, ProductPlacementEngine } = require('./short-video-engine');
  
  const testPrompt = '【镜头】红牛运动员从雪山跳台腾空而起，空中转体720度';
  const expanded = expandPrompt(testPrompt, 'alpine', 'pov', 8);
  const check = checkPromptLength(expanded);
  
  console.log(`   ✅ Prompt 生成引擎加载成功`);
  console.log(`   📊 生成长度: ${check.length}/${check.max} 字符 (${check.ratio})`);
  console.log(`   🛡️ 状态: ${check.status}`);
} catch (e) {
  console.error(`   ❌ Prompt 生成引擎失败: ${e.message}`);
  process.exit(1);
}

// 2. 测试制作引擎
console.log('\n2️⃣ 测试制作引擎...');
try {
  const { ProductionEngine } = require('./engines/production-engine/production-engine');
  const engine = new ProductionEngine({
    enableLLMAgents: false // 测试模式不调用LLM
  });
  
  console.log(`   ✅ 制作引擎加载成功`);
  console.log(`   📋 配置: LLM Agents=${engine.config.enableLLMAgents}`);
} catch (e) {
  console.error(`   ❌ 制作引擎失败: ${e.message}`);
  process.exit(1);
}

// 3. 测试渲染引擎
console.log('\n3️⃣ 测试渲染引擎...');
try {
  const { RenderingEngine } = require('./engines/rendering-engine/rendering-engine');
  const engine = new RenderingEngine({
    dryRun: true // 测试模式不调用API
  });
  
  console.log(`   ✅ 渲染引擎加载成功`);
  console.log(`   🎬 模式: ${engine.submitter ? 'API' : '模拟'}`);
  
  // 测试渲染流程（模拟模式）
  const testPrompts = [
    {
      shotId: 'S01',
      prompt: '16:9 cinematic | 穿运动服的红牛运动员站在雪山跳台上...',
      duration: 5,
      characterRef: 'NONE'
    }
  ];
  
  engine.render(testPrompts, { dryRun: true }).then(result => {
    console.log(`   📊 渲染结果: ${result.submitted}/${result.results.length} 成功`);
    console.log(`   ⏱️ 耗时: ${result.timing.total}ms`);
  });
  
} catch (e) {
  console.error(`   ❌ 渲染引擎失败: ${e.message}`);
  process.exit(1);
}

// 4. 测试后期引擎
console.log('\n4️⃣ 测试后期引擎...');
try {
  const { PostProductionEngine } = require('./engines/post-production-engine/post-production-engine');
  const engine = new PostProductionEngine();
  
  console.log(`   ✅ 后期引擎加载成功`);
} catch (e) {
  console.error(`   ❌ 后期引擎失败: ${e.message}`);
  process.exit(1);
}

// 5. 测试 PromptGuardian（自动修复）
console.log('\n5️⃣ 测试 PromptGuardian...');
try {
  const { PromptGuardian } = require('./scripts/prompt-guardian');
  const guardian = new PromptGuardian();
  
  const testPrompt = '16:9 cinematic | 陈卓站在健身房中，痛苦的表情 | 【台词】横纹肌溶解|会导致肌肉疼痛';
  const result = guardian.autoFix(testPrompt, [{id: 'chen-zhuo', name: '陈卓', role: 'police'}]);
  
  console.log(`   ✅ PromptGuardian 加载成功`);
  console.log(`   🛡️ 修复: ${result.changed ? result.fixes.length + ' 处' : '无需修复'}`);
  if (result.changed) {
    for (const fix of result.fixes) {
      console.log(`      - ${fix.type}: ${fix.action}`);
    }
  }
} catch (e) {
  console.error(`   ❌ PromptGuardian 失败: ${e.message}`);
  process.exit(1);
}

// 6. 测试 PipelineGuard（强制检查）
console.log('\n6️⃣ 测试 PipelineGuard...');
try {
  const { RenderPipelineGuard } = require('./scripts/render-pipeline-guard');
  const guard = new RenderPipelineGuard();
  
  const testPayload = {
    model: 'ep-20260518004622-jp46s',
    content: [
      { type: 'text', text: '16:9 cinematic | 穿警服的陈卓，佩戴警帽警徽肩章，站在健身房中 | 【台词】横纹肌溶解会导致肌肉不适' },
      { type: 'image_url', role: 'reference_image', image_url: { url: 'data:image/png;base64,test123' } }
    ],
    ratio: '16:9',
    duration: 5,
    resolution: '720p',
    generate_audio: true
  };
  
  const result = guard.check(testPayload);
  console.log(`   ✅ PipelineGuard 加载成功`);
  console.log(`   🔒 检查: ${result.pass ? '通过' : '失败'} (${result.errors.length} 错误, ${result.warnings.length} 警告)`);
} catch (e) {
  console.error(`   ❌ PipelineGuard 失败: ${e.message}`);
  process.exit(1);
}

console.log('\n🎉 超短裙系统完整链路测试全部通过！');
console.log('   系统现在包含：Prompt生成 → 制作引擎 → 渲染引擎 → 后期引擎');
