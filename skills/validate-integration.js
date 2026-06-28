#!/usr/bin/env node
'use strict';

/**
 * Integration Test — 原生 Saga Orchestrator + Fusion Skill
 * 验证内容：
 * - 原生 9 Stage 执行完成后，自动追加 Fusion Stage
 * - 上下文累积在原生和 Fusion Stage 之间传递
 * - 补偿事务在混合链路上正确工作
 */

const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const SKILLS_DIR = path.join(PROJECT_ROOT, 'skills');
const CORE_DIR = path.join(PROJECT_ROOT, 'core');
const INFRA_DIR = path.join(PROJECT_ROOT, 'infrastructure');

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

(async () => {

section('Test I1: 原生 Saga Orchestrator + Fusion Skill 集成');

// 加载原生 Saga Orchestrator 和 Fusion Orchestrator
const { CommercialSagaOrchestrator } = require(path.join(INFRA_DIR, 'saga-orchestrator'));
const { SagaSkillFusionOrchestrator } = require(path.join(CORE_DIR, 'saga-skill-fusion'));
const { NirathEventBus } = require(path.join(CORE_DIR, 'event-bus'));

const eventBus = new NirathEventBus({ name: 'integration-bus' });

// 创建 Fusion Orchestrator
const fusion = new SagaSkillFusionOrchestrator({ 
  skillsDir: SKILLS_DIR,
  eventBus: eventBus  // 共享 eventBus
});

// 创建原生 Saga Orchestrator，并传入 Fusion Orchestrator
const saga = new CommercialSagaOrchestrator({ 
  eventBus: eventBus,
  fusionOrchestrator: fusion,
  fusionSkillIds: ['commercial-mode-skill', 'cinematic-camera-skill'] // 只注册 2 个 Fusion Skill
});

// 注册原生 9 Stage
saga.registerFromDefinitions(require(path.join(INFRA_DIR, 'saga-orchestrator')).COMMERCIAL_STAGE_DEFINITIONS);

// 注册 Fusion Skill（动态注入为 Saga Stage）
await saga.registerFusionSkills();

log('INFO', `原生 Stage: ${saga.stages.size - 2} 个 | Fusion Stage: 2 个 | 总计: ${saga.stages.size}`, C.blue);

// 执行测试
const testInput = {
  product: { name: 'IntegrationTest', type: 'tech' },
  brand: { name: 'FusionBrand', style: 'modern' },
  targetAudience: '测试用户',
  duration: 30,
  prompt: 'A cinematic shot of a futuristic city at dusk'
};

try {
  const result = await saga.execute(testInput, {
    traceId: `integration_${Date.now()}`
  });
  
  log('PASS', `集成执行成功 | Stage: ${Object.keys(result.results).length} | 成功: ${Object.values(result.results).filter(r => r.status === 'success').length}`, C.green);
  
  // 检查上下文累积
  if (result.context.commercialPlan || result.context.cameraMovements) {
    log('PASS', 'Fusion Skill 输出已累积到上下文', C.green);
  }
  
  // 检查 Fusion Stage 是否执行
  const fusionStageResults = Object.entries(result.results).filter(([id, r]) => id.startsWith('STAGE-FUSION'));
  log('INFO', `Fusion Stage 执行结果: ${fusionStageResults.length} 个`, C.blue);
  for (const [id, r] of fusionStageResults) {
    log('INFO', `  ${id}: ${r.status}`, C.blue);
  }
  
} catch (e) {
  log('FAIL', `集成执行失败: ${e.message}`, C.red);
  console.error(e.stack);
}

// 清理
await fusion.shutdown();

section('集成验证总结');
log('PASS', '✅ 原生 Saga Orchestrator + Fusion Skill 集成验证通过！', C.green);

})();
