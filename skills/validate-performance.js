#!/usr/bin/env node
'use strict';

/**
 * Performance Benchmark — 三系统融合性能基准测试
 * 测试内容：
 * - 16 个 Skill 并发加载时间
 * - 端到端 Pipeline 执行时间
 * - 内存占用
 * - 事件吞吐量
 */

const path = require('path');
const v8 = require('v8');

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

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: formatBytes(usage.rss),
    heapTotal: formatBytes(usage.heapTotal),
    heapUsed: formatBytes(usage.heapUsed),
    external: formatBytes(usage.external)
  };
}

(async () => {

section('Performance Benchmark — 三系统融合性能基准测试');

const { SagaSkillFusionOrchestrator } = require(path.join(CORE_DIR, 'saga-skill-fusion'));
const { NirathEventBus } = require(path.join(CORE_DIR, 'event-bus'));

// ============================================================
// Test P1: 16 个 Skill 并发加载性能
// ============================================================
section('Test P1: 16 个 Skill 并发加载性能');

const memBefore = getMemoryUsage();
log('INFO', `内存基线: RSS=${memBefore.rss}, Heap=${memBefore.heapUsed}`, C.blue);

const eventBus = new NirathEventBus({ name: 'perf-bus' });
const fusion = new SagaSkillFusionOrchestrator({ 
  skillsDir: SKILLS_DIR,
  eventBus: eventBus
});

const loadStart = Date.now();
await fusion.initialize();
const loadTime = Date.now() - loadStart;

const memAfter = getMemoryUsage();
log('PASS', `Skill 加载完成: ${fusion.skillInstances.size} 个 | 耗时: ${loadTime}ms`, C.green);
log('INFO', `内存变化: RSS=${memAfter.rss}, Heap=${memAfter.heapUsed}`, C.blue);

// ============================================================
// Test P2: 端到端 Pipeline 执行时间（多次采样）
// ============================================================
section('Test P2: 端到端 Pipeline 执行时间');

const testInput = {
  product: { name: 'PerfTest', type: 'tech' },
  brand: { name: 'PerfBrand', style: 'modern' },
  targetAudience: '测试用户',
  duration: 30,
  prompt: 'A cinematic shot of a futuristic city at dusk',
  prompts: ['Shot 1', 'Shot 2'],
  cameraPlan: { shots: [{ id: 'P001', scale: 'MS', duration: 3, movement: 'pan', prompt: '性能测试镜头' }] },
  renderConfig: { width: 1920, height: 1080, format: 'mp4' },
  pipeline: { stages: ['render', 'encode'] }
};

// 测试 1: 卓越 6 Skill
const zhuoyueSkills = [
  'prompt-guardian-skill', 'commercial-mode-skill', 'cinematic-camera-skill',
  'continuity-engine-skill', 'render-pipeline-guard-skill', 'post-production-skill'
];

const times = [];
for (let i = 0; i < 5; i++) {
  const start = Date.now();
  await fusion.execute(testInput, {
    traceId: `perf_zhuoyue_${i}`,
    includeSkills: zhuoyueSkills
  });
  times.push(Date.now() - start);
}

const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
const minTime = Math.min(...times);
const maxTime = Math.max(...times);

log('PASS', `卓越 6 Skill Pipeline: 平均 ${avgTime.toFixed(1)}ms | 最小 ${minTime}ms | 最大 ${maxTime}ms`, C.green);

// 测试 2: 暴风 10 Skill
const stormaxeSkills = [
  'shanhaijing-storyforge-pro', 'shanhaijing-persona-vault', 'shanhaijing-voice-craft',
  'shanhaijing-quality-oracle', 'shanhaijing-soul-forge', 'shanhaijing-narrative-consistency',
  'shanhaijing-bestiary', 'shanhaijing-world-engine', 'shanhaijing-integrator', 'shanhaijing-director'
];

const stormTimes = [];
for (let i = 0; i < 5; i++) {
  const start = Date.now();
  await fusion.execute(testInput, {
    traceId: `perf_storm_${i}`,
    includeSkills: stormaxeSkills
  });
  stormTimes.push(Date.now() - start);
}

const avgStorm = stormTimes.reduce((a, b) => a + b, 0) / stormTimes.length;
log('PASS', `暴风 10 Skill Pipeline: 平均 ${avgStorm.toFixed(1)}ms | 最小 ${Math.min(...stormTimes)}ms | 最大 ${Math.max(...stormTimes)}ms`, C.green);

// 测试 3: 混合 16 Skill
const allSkills = [...zhuoyueSkills, ...stormaxeSkills];
const mixStart = Date.now();
const mixResult = await fusion.execute(testInput, {
  traceId: `perf_mix`,
  includeSkills: allSkills
});
const mixTime = Date.now() - mixStart;

log('PASS', `混合 16 Skill Pipeline: ${mixTime}ms | 成功 Stage: ${mixResult.executedStages.filter(s => s.status === 'success').length}/${mixResult.executedStages.length}`, C.green);

// ============================================================
// Test P3: 事件吞吐量
// ============================================================
section('Test P3: 事件吞吐量');

const eventReport = eventBus.getReport();
if (eventReport) {
  const totalEvents = eventReport.totalEvents || 0;
  const totalTime = mixTime + (avgTime * 5) + (avgStorm * 5); // 近似总时间
  const throughput = totalEvents / (totalTime / 1000);
  log('INFO', `总事件: ${totalEvents} | 近似吞吐量: ${throughput.toFixed(1)} events/sec`, C.blue);
}

// ============================================================
// Test P4: 内存占用分析
// ============================================================
section('Test P4: 内存占用分析');

const memFinal = getMemoryUsage();
log('INFO', `最终内存: RSS=${memFinal.rss}, Heap=${memFinal.heapUsed}`, C.blue);

const heapStats = v8.getHeapStatistics();
log('INFO', `V8 Heap: 总 ${formatBytes(heapStats.total_heap_size)} | 已用 ${formatBytes(heapStats.used_heap_size)} | 限制 ${formatBytes(heapStats.heap_size_limit)}`, C.blue);

// ============================================================
// 清理
// ============================================================
await fusion.shutdown();

// ============================================================
// 总结
// ============================================================
section('性能基准测试总结');

log('INFO', `Skill 加载: ${loadTime}ms | ${fusion.skillInstances.size} 个`, C.blue);
log('INFO', `卓越 Pipeline: 平均 ${avgTime.toFixed(1)}ms (6 Skill)`, C.blue);
log('INFO', `暴风 Pipeline: 平均 ${avgStorm.toFixed(1)}ms (10 Skill)`, C.blue);
log('INFO', `混合 Pipeline: ${mixTime}ms (16 Skill)`, C.blue);
log('INFO', `内存: RSS=${memFinal.rss}, Heap=${memFinal.heapUsed}`, C.blue);

log('PASS', '✅ 性能基准测试完成！', C.green);

})();
