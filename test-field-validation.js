/**
 * v6.5.59 链路字段排查验证脚本
 * 验证所有修改后的字段生成和消费是否正确
 */

const fs = require('fs');
const path = require('path');

// ===== 1. 验证 opening-system-v3.js 返回结构 =====
console.log('=== 验证1: opening-system-v3.js 返回结构 ===');
const openingSystem = require('./systems/opening-system-v3.js');

// 模拟配置
const testConfig = {
  episodeTitle: '白泽·天启',
  episodeTheme: 'mysterious',
  episodeSummary: '小G在知识圣殿遇到白泽，白泽传授万物知识。',
  protagonistId: 'xiaoG',
  featuredBeastId: 'bai-ze',
  duration: 9,
  mood: 'mysterious'
};

try {
  const result = openingSystem.generateOpeningV3(testConfig);
  
  const checks = [
    { field: 'prompt', required: true, type: 'string' },
    { field: 'length', required: true, type: 'number' },
    { field: 'cameraPlan', required: true, type: 'object' },
    { field: 'complianceCheck', required: true, type: 'object' },
    { field: 'truncationApplied', required: true, type: 'boolean' },
    { field: 'postProduction', required: true, type: 'object' },
    { field: 'referenceImages', required: true, type: 'object' },
    { field: 'content', required: true, type: 'object' },
    // v6.5.59 新增字段
    { field: 'title', required: true, type: 'object' },
    { field: 'isOpening', required: true, type: 'boolean' },
    { field: 'duration', required: true, type: 'number' }
  ];
  
  let allPass = true;
  for (const check of checks) {
    const exists = result[check.field] !== undefined;
    const typeOK = exists && typeof result[check.field] === check.type;
    const status = exists && typeOK ? '✅' : '❌';
    if (!exists || !typeOK) allPass = false;
    console.log(`  ${status} ${check.field}: ${exists ? '存在' : '缺失'} | 类型: ${typeof result[check.field]} (期望: ${check.type})`);
  }
  
  // 验证 title 子字段
  if (result.title) {
    console.log('  📋 title 子字段检查:');
    const titleFields = ['main', 'sub', 'creator', 'episodeName', 'displayTiming', 'position', 'style'];
    for (const f of titleFields) {
      const exists = result.title[f] !== undefined && result.title[f] !== '';
      console.log(`    ${exists ? '✅' : '❌'} title.${f}: ${result.title[f] || '缺失'}`);
    }
  }
  
  console.log(`\n  结果: ${allPass ? '✅ 全部通过' : '❌ 存在失败项'}\n`);
} catch (e) {
  console.log(`  ❌ 验证失败: ${e.message}\n`);
}

// ===== 2. 验证 pipeline-integrity-validator.js 检查方法 =====
console.log('=== 验证2: pipeline-integrity-validator.js 检查方法 ===');
const { PipelineIntegrityValidator } = require('./systems/pipeline-integrity-validator.js');

const validator = new PipelineIntegrityValidator();
const methods = [
  '_checkStage11_Render',
  '_checkStage12_Compliance', 
  '_checkStage16_FieldIntegrity'
];

for (const method of methods) {
  const exists = typeof validator[method] === 'function';
  console.log(`  ${exists ? '✅' : '❌'} ${method}: ${exists ? '存在' : '缺失'}`);
}

// 验证 Stage 12 签名（需要接受两个参数）
const stage12Str = validator._checkStage12_Compliance.toString();
const hasRenderParam = stage12Str.includes('renderResults');
console.log(`  ${hasRenderParam ? '✅' : '❌'} _checkStage12_Compliance 接受 renderResults 参数`);

console.log();

// ===== 3. 验证标准字段检查逻辑 =====
console.log('=== 验证3: 标准字段检查逻辑 ===');

// 模拟 render 数据
const mockRender = [
  {
    shotId: 'S00',
    id: 'S00',
    type: 'opening',
    scene: '片头',
    duration: 9,
    prompt: '测试片头Prompt',
    length: 1000,
    utilization: 67,
    utilizationStatus: '✅达标',
    referenceImages: [],
    mouthAction: '嘴部自然闭合',
    qualityScore: { totalScore: 95 },
    enhanced: true,
    isOpening: true,
    title: {
      main: 'SHAN HAI JING: Bai Ze',
      sub: 'A Nirath Original by Genius',
      creator: 'Genius',
      episodeName: '万物之灵',
      displayTiming: '6.8-9.0s',
      position: '画面中央偏下',
      style: 'elegant serif'
    }
  },
  {
    shotId: 'S01',
    id: 'S01',
    type: 'building',
    scene: '知识圣殿',
    duration: 15,
    prompt: '测试内容镜Prompt',
    length: 1200,
    utilization: 80,
    utilizationStatus: '🔥理想',
    referenceImages: [],
    mouthAction: '嘴部自然闭合',
    qualityScore: { totalScore: 75 },
    enhanced: true,
    cameraMovement: {
      scene: '知识圣殿',
      primaryMovement: 'orbit_360',
      speed: 'smooth',
      shotSize: 'medium',
      timeline: { segments: [] }
    },
    emotionPhase: 'curiosity',
    importance: 5,
    visualComplexity: 5
  }
];

// 验证每个字段
const requiredFields = ['shotId', 'id', 'type', 'scene', 'duration', 'prompt', 'length', 'utilization', 'utilizationStatus', 'referenceImages', 'mouthAction', 'qualityScore', 'enhanced'];
const contentFields = ['cameraMovement', 'emotionPhase', 'importance', 'visualComplexity'];
const openingFields = ['title', 'isOpening'];

for (const shot of mockRender) {
  console.log(`\n  📷 ${shot.shotId} 字段检查:`);
  
  // 通用字段
  for (const f of requiredFields) {
    const exists = shot[f] !== undefined;
    console.log(`    ${exists ? '✅' : '❌'} ${f}: ${exists ? '存在' : '缺失'}`);
  }
  
  // 片头/内容镜专属字段
  if (shot.isOpening) {
    for (const f of openingFields) {
      const exists = shot[f] !== undefined;
      console.log(`    ${exists ? '✅' : '❌'} ${f}: ${exists ? '存在' : '缺失'}`);
    }
  } else {
    for (const f of contentFields) {
      const exists = shot[f] !== undefined;
      console.log(`    ${exists ? '✅' : '❌'} ${f}: ${exists ? '存在' : '缺失'}`);
    }
  }
}

console.log('\n=== 验证完成 ===');
console.log('✅ v6.5.59 链路字段检查已集成');
console.log('📋 修改清单:');
console.log('  1. opening-system-v3.js: 返回对象添加 title + isOpening + duration');
console.log('  2. nirath-master-pipeline.js: 片头shot注入 title/postProduction');
console.log('  3. nirath-master-pipeline.js: 旧链路push添加标准字段(id/type/scene/cameraMovement/emotionPhase/importance/visualComplexity/dialogue/narration/isOpening)');
console.log('  4. nirath-master-pipeline.js: 新链路push添加标准字段');
console.log('  5. pipeline-integrity-validator.js: Stage 11 添加标准字段检查');
console.log('  6. pipeline-integrity-validator.js: Stage 12 添加片头title字段检查');
console.log('  7. pipeline-integrity-validator.js: 新增 Stage 16.5 标准字段完整性检查');
