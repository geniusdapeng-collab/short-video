#!/usr/bin/env node
/**
 * 【正确运动姿势EP02】通用写实风格渲染脚本
 * 基于 render-pipeline-universal.js 通用渲染管线
 */

const fs = require('fs').promises;
const fss = require('fs');
const path = require('path');
const { UniversalRenderPipeline } = require('../../systems/render-engines/render-pipeline-universal.js');

// 项目配置
const PROJECT_CONFIG = require('../project-config.json');
const SHOTS = require('../shots/shot-prompts.json');

// 工作目录
const WORK_DIR = path.join(__dirname, '..');

async function main() {
  console.log('🎬 【正确运动姿势EP02】通用写实风格渲染启动\n');
  console.log(`📊 项目: ${PROJECT_CONFIG.projectName}`);
  console.log(`🎭 角色: ${PROJECT_CONFIG.characters.join(', ')}`);
  console.log(`📹 镜头数: ${SHOTS.length}镜，${SHOTS.reduce((a, s) => a + s.duration, 0)}秒\n`);
  
  // 初始化通用渲染管线
  const pipeline = new UniversalRenderPipeline({
    ...PROJECT_CONFIG,
    outputDir: path.join(WORK_DIR, 'production', 'shots')
  });
  
  // 批量渲染
  const results = await pipeline.renderBatch(SHOTS);
  
  // 保存任务记录
  const taskLog = results
    .filter(r => r.status === 'success' && r.taskId)
    .map(r => `${r.shot.id}: ${r.taskId}`)
    .join('\n');
  
  if (taskLog) {
    fss.writeFileSync(
      path.join(WORK_DIR, 'production', 'render-tasks.log'),
      taskLog
    );
    console.log('\n📝 任务记录已保存');
  }
  
  // 最终报告
  const success = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'failed');
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 最终报告');
  console.log('='.repeat(50));
  console.log(`✅ 成功: ${success.length}/${results.length}`);
  console.log(`❌ 失败: ${failed.length}/${results.length}`);
  console.log(`📁 输出目录: ${path.join(WORK_DIR, 'production', 'shots')}`);
  
  if (success.length === results.length) {
    console.log('\n🎉 全部渲染成功！准备后期合并...');
    console.log('运行: bash scripts/post-production.sh');
  }
}

main().catch(console.error);
