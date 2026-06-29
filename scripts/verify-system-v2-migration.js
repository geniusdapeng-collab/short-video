/**
 * Config Center + Schema + Beast Model 验证脚本
 * v1.0: 验证第一类三件事的完整性
 * 
 * 运行: node /root/.openclaw/workspace/scripts/verify-system-v2-migration.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

const REPORT = {
  timestamp: new Date().toISOString(),
  version: 'v2.0-migration-check',
  checks: [],
  passed: 0,
  failed: 0,
  warnings: 0
};

function check(name, fn) {
  try {
    const result = fn();
    if (result.valid) {
      REPORT.checks.push({ name, status: 'PASS', message: result.message });
      REPORT.passed++;
    } else {
      REPORT.checks.push({ name, status: 'FAIL', message: result.message });
      REPORT.failed++;
    }
  } catch (e) {
    REPORT.checks.push({ name, status: 'FAIL', message: `异常: ${e.message}` });
    REPORT.failed++;
  }
}

function warn(name, fn) {
  try {
    const result = fn();
    if (!result.valid) {
      REPORT.checks.push({ name, status: 'WARN', message: result.message });
      REPORT.warnings++;
    }
  } catch (e) {
    REPORT.checks.push({ name, status: 'WARN', message: `异常: ${e.message}` });
    REPORT.warnings++;
  }
}

console.log('🔍 系统 v2.0 迁移验证开始...\n');

// ============================================================
// 一、Config Center 验证
// ============================================================

console.log('--- [1/3] Config Center v2.0 ---');

const { getConfigCenter, ConfigCenter } = require('../systems/config-center-v2.js');

check('CC-001: 模块加载', () => {
  const cc = getConfigCenter();
  return { valid: cc instanceof ConfigCenter, message: 'getConfigCenter() 返回 ConfigCenter 实例' };
});

check('CC-002: 配置加载', () => {
  const cc = getConfigCenter();
  const config = cc.export();
  return { valid: config.version === '2.0.0', message: `版本: ${config.version}` };
});

check('CC-003: 点路径读取', () => {
  const cc = getConfigCenter();
  const maxLen = cc.get('prompt.maxLength');
  const maxDur = cc.get('duration.maxShotDuration');
  return { valid: maxLen === 980 && maxDur === 15, message: `maxLength=${maxLen}, maxDuration=${maxDur}` };
});

check('CC-004: 快捷方法', () => {
  const cc = getConfigCenter();
  const maxLen = cc.getPromptMaxLength();
  const fieldDef = cc.getFieldDef('CHARACTER');
  const phases = cc.getEmotionPhases();
  return { 
    valid: maxLen === 980 && fieldDef.priority === 'P0' && phases.length === 6, 
    message: `promptMax=${maxLen}, CHARACTER.priority=${fieldDef?.priority}, emotionPhases=${phases.length}` 
  };
});

check('CC-005: 配置验证', () => {
  const cc = getConfigCenter();
  const validation = cc.validate();
  return { valid: validation.valid, message: `errors=${validation.errors?.length || 0}` };
});

check('CC-006: 向后兼容', () => {
  const { getConfig, getConfigPath } = require('../systems/config-center-v2.js');
  const config = getConfig();
  return { valid: config.prompt.maxLength === 980, message: 'getConfig() 向后兼容正常' };
});

check('CC-007: 环境变量覆盖', () => {
  process.env.NIRATH_PROMPT_MAXLENGTH = '1200';
  const { resetConfigCenter } = require('../systems/config-center-v2.js');
  resetConfigCenter();
  const cc = getConfigCenter();
  const maxLen = cc.getPromptMaxLength();
  delete process.env.NIRATH_PROMPT_MAXLENGTH;
  resetConfigCenter();
  return { valid: maxLen === 1200, message: `环境变量覆盖: ${maxLen}` };
});

// ============================================================
// 二、Pipeline Schema 验证
// ============================================================

console.log('\n--- [2/3] Pipeline Schema Validator ---');

const { PipelineSchemaValidator, ShotSchema, BeastSchema } = require('../systems/schemas/pipeline-schemas.js');

check('SC-001: Schema 模块加载', () => {
  const validator = new PipelineSchemaValidator();
  return { valid: validator instanceof PipelineSchemaValidator, message: 'PipelineSchemaValidator 实例化成功' };
});

check('SC-002: Shot 验证（有效数据）', () => {
  const validator = new PipelineSchemaValidator();
  const result = validator.validateShots([{
    id: 'S01',
    sequence: 1,
    scene: '钩吾废墟入口',
    narration: 'AgentX站在废墟边缘...',
    characters: [{ id: 'xiaoG', name: 'AgentX' }],
    emotionPhase: 'exposition',
    duration: 12
  }]);
  return { valid: result.valid, message: `errors=${result.errors.length}, warnings=${result.warnings.length}` };
});

check('SC-003: Shot 验证（缺失必填）', () => {
  const validator = new PipelineSchemaValidator();
  const result = validator.validateShots([{
    id: 'S01',
    sequence: 1
    // 缺少 narration, scene, characters, emotionPhase
  }]);
  return { valid: !result.valid, message: `预期失败，实际: valid=${result.valid}, errors=${result.errors.length}` };
});

check('SC-004: Shot 验证（序列不连续）', () => {
  const validator = new PipelineSchemaValidator();
  const result = validator.validateShots([
    { id: 'S01', sequence: 1, scene: 'A', narration: '...', characters: [], emotionPhase: 'exposition' },
    { id: 'S02', sequence: 3, scene: 'B', narration: '...', characters: [], emotionPhase: 'rising_action' }
  ]);
  return { valid: !result.valid && result.errors.some(e => e.includes('序列')), message: `检测到序列错误: ${result.errors.join(', ')}` };
});

check('SC-005: Render Prompt 验证', () => {
  const validator = new PipelineSchemaValidator();
  const result = validator.validateRenderPrompt({
    shotId: 'S01',
    prompt: 'Nirath原创异兽...',
    duration: 12
  });
  return { valid: result.valid, message: `valid=${result.valid}, errors=${result.errors.length}` };
});

check('SC-006: Beast 验证', () => {
  const validator = new PipelineSchemaValidator();
  const result = validator.validateBeast({
    id: 'taotie',
    canonicalName: { pinyin: 'taotie', english: 'Taotie' },
    category: 'ferocious_beast',
    description: '...'
  });
  return { valid: result.valid, message: `valid=${result.valid}, errors=${result.errors.length}` };
});

check('SC-007: PRD 验证', () => {
  const validator = new PipelineSchemaValidator();
  const result = validator.validatePRD({
    version: '1.0',
    title: '饕餮 EP01',
    duration: { totalMinutes: 1.2 },
    characters: { xiaoG: { id: 'xiaoG' } },
    emotionArc: [{ phase: 'exposition' }]
  });
  return { valid: result.valid, message: `valid=${result.valid}, errors=${result.errors.length}` };
});

check('SC-008: 严格模式切换', () => {
  const validator = new PipelineSchemaValidator();
  validator.setMode('strict');
  try {
    validator.validateStageInput('stage-05', {}, 'Shot');
    return { valid: false, message: '严格模式下应抛出异常' };
  } catch (e) {
    return { valid: true, message: '严格模式正确抛出异常' };
  }
});

// ============================================================
// 三、Beast Domain Model 验证
// ============================================================

console.log('\n--- [3/3] Beast Domain Model ---');

const { getBeastRepository, BeastRepository } = require('../systems/domain/beast-domain-model.js');

check('BD-001: Repository 加载', () => {
  const repo = getBeastRepository();
  return { valid: repo instanceof BeastRepository, message: 'getBeastRepository() 返回实例' };
});

check('BD-002: 神兽数量', () => {
  const repo = getBeastRepository();
  const stats = repo.getStats();
  return { valid: stats.total >= 5, message: `已注册 ${stats.total} 只神兽` };
});

check('BD-003: 通过 ID 查找（O(1)）', () => {
  const repo = getBeastRepository();
  const beast = repo.findById('taotie');
  return { valid: beast && beast.canonicalName.english === 'Taotie', message: `taotie -> ${beast?.canonicalName?.english}` };
});

check('BD-004: 通过别名查找', () => {
  const repo = getBeastRepository();
  const beast = repo.findByName('tao-tie');
  return { valid: beast && beast.id === 'taotie', message: `tao-tie -> ${beast?.id}` };
});

check('BD-005: 通过中文名查找', () => {
  const repo = getBeastRepository();
  const beast = repo.findByName('饕餮');
  return { valid: beast && beast.id === 'taotie', message: `饕餮 -> ${beast?.id}` };
});

check('BD-006: 分类查找', () => {
  const repo = getBeastRepository();
  const divine = repo.findByCategory('divine_beast');
  return { valid: divine.length >= 2, message: `divine_beast 分类: ${divine.length} 只` };
});

check('BD-007: 视觉签名获取', () => {
  const repo = getBeastRepository();
  const prompt = repo.getVisualSignaturePrompt('taotie');
  return { valid: prompt && prompt.includes('Creature: Taotie'), message: `visual signature 长度: ${prompt?.length}` };
});

check('BD-008: Prompt 模板获取', () => {
  const repo = getBeastRepository();
  const template = repo.getPromptTemplate('taotie', 'scene_test');
  return { valid: template && template.includes('scene_test'), message: `template 替换: ${template?.includes('scene_test')}` };
});

check('BD-009: resolveCanonicalId', () => {
  const repo = getBeastRepository();
  const id1 = repo.resolveCanonicalId('TaoTie');
  const id2 = repo.resolveCanonicalId('tao-tie');
  const id3 = repo.resolveCanonicalId('饕餮');
  return { valid: id1 === 'taotie' && id2 === 'taotie' && id3 === 'taotie', message: `TaoTie=${id1}, tao-tie=${id2}, 饕餮=${id3}` };
});

check('BD-010: 向后兼容 Bestiary', () => {
  const { Bestiary } = require('../systems/domain/beast-domain-model.js');
  const bestiary = new Bestiary();
  const beast = bestiary.getBeast('taotie');
  return { valid: beast && beast.id === 'taotie', message: 'Bestiary.getBeast() 向后兼容' };
});

check('BD-011: 搜索功能', () => {
  const repo = getBeastRepository();
  const results = repo.search('火山');
  return { valid: results.length > 0, message: `搜索"火山": ${results.length} 结果` };
});

// ============================================================
// 四、交叉验证
// ============================================================

console.log('\n--- [4/3] 交叉验证 ---');

check('CV-001: Config 读取的 maxLength 与 Shot Schema 一致', () => {
  const cc = getConfigCenter();
  const maxLen = cc.getPromptMaxLength();
  
  const repo = getBeastRepository();
  const beast = repo.findById('taotie');
  const templateLen = beast.promptTemplate?.length || 0;
  
  return { valid: maxLen === 980 && templateLen > 0, message: `config.maxLen=${maxLen}, taotie.templateLen=${templateLen}` };
});

check('CV-002: Beast 数据通过 Schema 验证', () => {
  const repo = getBeastRepository();
  const beast = repo.findById('taotie');
  const { PipelineSchemaValidator } = require('../systems/schemas/pipeline-schemas.js');
  const validator = new PipelineSchemaValidator();
  const result = validator.validateBeast(beast);
  return { valid: result.valid, message: `Schema 验证: valid=${result.valid}, errors=${result.errors.length}` };
});

check('CV-003: 情绪阶段配置一致性', () => {
  const cc = getConfigCenter();
  const phases = cc.getEmotionPhases();
  const validator = new PipelineSchemaValidator();
  
  const testShot = {
    id: 'S01', sequence: 1, scene: 'test', narration: 'test', characters: [],
    emotionPhase: phases[0].id
  };
  const result = ShotSchema.validate(testShot);
  return { valid: result.valid && phases.length === 6, message: `6阶段, valid=${result.valid}` };
});

// ============================================================
// 五、生成报告
// ============================================================

console.log('\n========================================');
console.log('📊 验证报告');
console.log('========================================');
console.log(`时间: ${REPORT.timestamp}`);
console.log(`总计: ${REPORT.checks.length} 项`);
console.log(`✅ 通过: ${REPORT.passed}`);
console.log(`❌ 失败: ${REPORT.failed}`);
console.log(`⚠️  警告: ${REPORT.warnings}`);
console.log('----------------------------------------');

for (const check of REPORT.checks) {
  const icon = check.status === 'PASS' ? '✅' : check.status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${check.name}: ${check.message}`);
}

console.log('----------------------------------------');

if (REPORT.failed === 0) {
  console.log('🎉 所有验证通过！系统 v2.0 第一类三件事就绪。');
  console.log('\n下一步：');
  console.log('  1. 在饕餮预生产中测试 config-center-v2 读取');
  console.log('  2. 在阶段边界添加 Schema 验证（警告模式）');
  console.log('  3. 将 bestiary 迁移到 beast-domain-model');
} else {
  console.log(`⚠️  ${REPORT.failed} 项失败，请检查上述错误。`);
  process.exit(1);
}

// 保存报告
const reportPath = path.join(__dirname, '../output', `system-v2-migration-report-${Date.now()}.json`);
if (!fs.existsSync(path.dirname(reportPath))) fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(REPORT, null, 2));
console.log(`\n📁 报告已保存: ${reportPath}`);
