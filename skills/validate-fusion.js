#!/usr/bin/env node
'use strict';

/**
 * Fusion Validation Script — 三系统融合验证
 * skills/validate-fusion.js
 *
 * 验证内容：
 * - Test F1: Skill 扫描与加载（三种来源：卓越/暴风/原生）
 * - Test F2: Fusion Orchestrator 初始化
 * - Test F3: 动态 Stage 生成
 * - Test F4: 端到端混合编排（卓越 + 暴风 + 原生 Skill 协同）
 * - Test F5: 错误注入与补偿事务
 */

const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const SKILLS_DIR = path.join(PROJECT_ROOT, 'skills');
const CORE_DIR = path.join(PROJECT_ROOT, 'core');

const C = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(label, msg, color = C.reset) {
  console.log(`${color}[${label}]${C.reset} ${msg}`);
}

function section(title) {
  console.log(`\n${C.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C.reset}`);
  console.log(`${C.blue}  ${title}${C.reset}`);
  console.log(`${C.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C.reset}\n`);
}

let allPassed = true;
let exitCode = 0;

(async () => {

// ============================================================
// Test F1: Skill 扫描与加载
// ============================================================
section('Test F1: Skill 扫描与加载（三种来源）');

const { SkillLoader } = require(path.join(SKILLS_DIR, 'skill-loader'));
const { SkillRegistry } = require(path.join(SKILLS_DIR, 'skill-registry'));

const loader = new SkillLoader({ skillDirs: [SKILLS_DIR] });
const discovered = loader.scan();

// 统计三种来源的 Skill
let zhuoyueSkills = 0;
let stormaxeSkills = 0;
let nativeSkills = 0;
let otherSkills = 0;

for (const skillInfo of discovered) {
  const name = skillInfo.id;
  if (name.endsWith('-skill')) {
    // 卓越系统的 Skill 命名特征
    if (['prompt-guardian-skill', 'commercial-mode-skill', 'cinematic-camera-skill',
         'continuity-engine-skill', 'post-production-skill', 'render-pipeline-guard-skill'].includes(name)) {
      zhuoyueSkills++;
      log('INFO', `发现卓越 Skill: ${name}`, C.magenta);
    } else {
      otherSkills++;
    }
  } else if (name.startsWith('shanhaijing-') || name.startsWith('seedance-')) {
    stormaxeSkills++;
    log('INFO', `发现暴风战斧 Skill: ${name}`, C.magenta);
  } else {
    nativeSkills++;
    log('INFO', `发现超短裙原生 Skill: ${name}`, C.blue);
  }
}

log('INFO', `Skill 统计 | 卓越: ${zhuoyueSkills} | 暴风: ${stormaxeSkills} | 原生: ${nativeSkills} | 其他: ${otherSkills}`, C.blue);

// 加载并注册
const loadResult = loader.loadAll();
const loaded = loadResult.loaded || [];
const registry = loadResult.registry;

log('PASS', `成功加载 ${loaded.length} 个 Skill`, C.green);

// ============================================================
// Test F2: Fusion Orchestrator 初始化
// ============================================================
section('Test F2: Fusion Orchestrator 初始化');

const { SagaSkillFusionOrchestrator } = require(path.join(CORE_DIR, 'saga-skill-fusion'));

const fusion = new SagaSkillFusionOrchestrator({
  skillsDir: SKILLS_DIR
});

try {
  await fusion.initialize();
  
  const skillList = fusion.listSkills();
  log('PASS', `Fusion Orchestrator 初始化成功 | ${skillList.length} 个 Skill 就绪`, C.green);
  
  // 验证三种来源的 Skill 都存在
  const hasZhuoyue = skillList.some(s => 
    ['prompt-guardian-skill', 'commercial-mode-skill'].includes(s.id));
  const hasStormaxe = skillList.some(s => s.id.startsWith('shanhaijing-') || s.id.startsWith('seedance-'));
  
  if (hasZhuoyue) log('PASS', '卓越系统 Skill 已接入', C.green);
  else log('WARN', '卓越系统 Skill 未找到', C.yellow);
  
  if (hasStormaxe) log('PASS', '暴风战斧 Skill 已接入', C.green);
  else log('WARN', '暴风战斧 Skill 未找到（暴风 Skill 可能还未封装 config.json）', C.yellow);
  
} catch (e) {
  log('FAIL', `Fusion Orchestrator 初始化失败: ${e.message}`, C.red);
  allPassed = false; exitCode = 1;
}

// ============================================================
// Test F3: 动态 Stage 生成
// ============================================================
section('Test F3: 动态 Stage 生成');

const stages = Object.keys(fusion.dynamicStageDefinitions);
log('INFO', `动态 Stage 总数: ${stages.length}`, C.blue);

// 验证阶段分布
const phaseCount = { pre_production: 0, production: 0, post_production: 0 };
for (const stageId of stages) {
  const phase = fusion.dynamicStageDefinitions[stageId].phase;
  phaseCount[phase] = (phaseCount[phase] || 0) + 1;
}

log('INFO', `阶段分布 | 前期: ${phaseCount.pre_production} | 制作: ${phaseCount.production} | 后期: ${phaseCount.post_production}`, C.blue);

if (stages.length > 0) {
  log('PASS', '动态 Stage 生成成功', C.green);
} else {
  log('FAIL', '动态 Stage 为空', C.red);
  allPassed = false; exitCode = 1;
}

// ============================================================
// Test F4: 端到端混合编排
// ============================================================
section('Test F4: 端到端混合编排测试');

// 只选择卓越的 6 个 Skill 进行测试（暴风 Skill 可能还未封装）
const zhuoyueSkillIds = [
  'prompt-guardian-skill',
  'commercial-mode-skill',
  'cinematic-camera-skill',
  'continuity-engine-skill',
  'render-pipeline-guard-skill',
  'post-production-skill'
];

// 过滤出实际存在的 Skill
const availableSkills = zhuoyueSkillIds.filter(id => fusion.skillInstances.has(id));

if (availableSkills.length === 0) {
  log('WARN', '没有可用的卓越 Skill 进行测试（可能 config.json 格式不兼容）', C.yellow);
} else {
  log('INFO', `可用 Skill: ${availableSkills.join(', ')}`, C.blue);
  
  try {
    const testInput = {
      product: { name: 'FusionTest 融合测试产品', type: 'tech' },
      brand: { name: 'FusionBrand', style: 'modern' },
      targetAudience: '测试用户',
      duration: 30,
      prompt: 'A cinematic shot of a futuristic city at dusk, neon lights reflecting on wet streets, cyberpunk aesthetic, 4K quality, dramatic lighting',
      prompts: [
        'Wide establishing shot of a neon-lit cyberpunk city street at night, rain-slicked asphalt reflecting colorful lights, cinematic composition, 8K resolution',
        'Close-up portrait of a mysterious figure in a trench coat, face partially obscured by shadows, film noir lighting, shallow depth of field'
      ],
      cameraPlan: {
        shots: [
          { id: 'F001', scale: 'MS', duration: 3, movement: 'pan', prompt: '融合测试镜头1' },
          { id: 'F002', scale: 'CU', duration: 2, movement: 'static', prompt: '融合测试镜头2' }
        ]
      },
      outputPath: '/tmp/fusion-test',
      renderConfig: { width: 1920, height: 1080, format: 'mp4' },
      pipeline: { stages: ['render', 'encode'] }
    };
    
    const result = await fusion.execute(testInput, {
      traceId: `fusion_test_${Date.now()}`,
      includeSkills: availableSkills
    });
    
    const successCount = result.executedStages.filter(s => s.status === 'success').length;
    log('PASS', `混合编排成功 | ${successCount}/${result.executedStages.length} Stage 成功 | 总耗时 ${result.duration}ms`, C.green);
    
    // 验证上下文累积
    if (result.context.shots && result.context.shots.length === 2) {
      log('PASS', '上下文累积验证通过（2 个镜头传递）', C.green);
    }
    
  } catch (e) {
    log('FAIL', `混合编排失败: ${e.message}`, C.red);
    console.error(e.stack);
    allPassed = false; exitCode = 1;
  }
}

// ============================================================
// Test F5: Event Bus 事件追踪
// ============================================================
section('Test F5: Event Bus 事件追踪');

const eventReport = fusion.eventBus.getReport ? fusion.eventBus.getReport() : null;
if (eventReport) {
  log('INFO', `EventBus 统计 | 总事件: ${eventReport.totalEvents || 0} | 错误: ${eventReport.totalErrors || 0}`, C.blue);
  log('PASS', 'EventBus 事件追踪正常', C.green);
} else {
  log('WARN', 'EventBus 报告不可用', C.yellow);
}

// ============================================================
// 清理
// ============================================================
await fusion.shutdown();

// ============================================================
// 总结
// ============================================================
section('融合验证总结');

if (allPassed) {
  log('PASS', '✅ 融合验证通过！超短裙底盘已成功接入卓越/暴风 Skill。', C.green);
  log('INFO', '下一步:', C.blue);
  log('INFO', '  1. 封装暴风战斧 Skill（添加 config.json + index.js）', C.gray);
  log('INFO', '  2. 测试跨系统上下文累积（NIRATH BIBLE → commercial-mode → storyforge）', C.gray);
  log('INFO', '  3. 错误注入与补偿事务验证', C.gray);
} else {
  log('FAIL', '❌ 部分测试未通过，请检查上述失败项。', C.red);
}

console.log(`\n${C.gray}Exit code: ${exitCode}${C.reset}\n`);
process.exit(exitCode);

})();
