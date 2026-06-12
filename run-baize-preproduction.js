#!/usr/bin/env node
'use strict';

/**
 * run-baize-preproduction.js
 * 白泽 EP01 预生产启动器
 * 🔥 v6.5.60-fix: 阶段级自动重试 + 断点恢复（1分钟间隔，最多3次）
 */

const fs = require('fs');
const path = require('path');
const { runPreproduction } = require('./systems/preproduction-service');
const { createLogger } = require('./systems/logger');

const logger = createLogger('baize-wrapper');
const CHECKPOINT_FILE = '/tmp/baize-checkpoint.json';
const MAX_RETRIES = 3;
const RETRY_INTERVAL_MS = 60000; // 1分钟

/**
 * 检查断点：上次是否被中断
 */
function checkCheckpoint() {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    try {
      const checkpoint = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
      logger.info('🔁 检测到断点，上次被中断', {
        stage: checkpoint.stage,
        timestamp: new Date(checkpoint.timestamp).toISOString()
      });
      return checkpoint;
    } catch (e) {
      logger.warn('断点文件损坏，忽略');
      return null;
    }
  }
  return null;
}

/**
 * 保存断点：当前阶段完成
 */
function saveCheckpoint(stage, data) {
  const checkpoint = {
    stage: stage,
    data: data,
    timestamp: Date.now(),
    status: 'running'
  };
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
  logger.info('💾 断点已保存', { stage });
}

/**
 * 清除断点：任务完成
 */
function clearCheckpoint() {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    fs.unlinkSync(CHECKPOINT_FILE);
    logger.info('🧹 断点已清除');
  }
}

/**
 * 睡眠函数：等待 N 毫秒
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 运行预生产（带重试和断点恢复）
 */
async function runWithRetry(input, options) {
  const checkpoint = checkCheckpoint();
  
  let attempt = 0;
  let lastError = null;
  
  while (attempt < MAX_RETRIES) {
    attempt++;
    logger.info(`🚀 第 ${attempt}/${MAX_RETRIES} 次尝试`);
    
    try {
      const result = await runPreproduction(input, {
        ...options,
        checkpoint: checkpoint, // 传入断点，让 preproduction-service 知道从哪继续
        onStageComplete: (stage, data) => saveCheckpoint(stage, data) // 每个阶段完成保存断点
      });
      
      clearCheckpoint();
      logger.info('✅ 预生产完成', {
        jsonPath: result.jsonPath,
        mdPath: result.mdPath,
        totalDuration: result.totalDuration,
        attempts: attempt
      });
      
      return result;
    } catch (err) {
      lastError = err;
      logger.error(`⚠️ 第 ${attempt} 次尝试失败`, {
        error: err.message,
        stage: err.stage || 'unknown'
      });
      
      if (attempt < MAX_RETRIES) {
        logger.info(`⏳ 等待 ${RETRY_INTERVAL_MS / 1000} 秒后重试...`);
        await sleep(RETRY_INTERVAL_MS);
      }
    }
  }
  
  // 3次都失败
  throw new Error(`预生产失败（已重试${MAX_RETRIES}次）: ${lastError.message}`);
}

async function main() {
  logger.info('🎬 白泽 EP01 预生产启动（v6.5.60 自动重试版）');

  const inputPath = path.join(__dirname, 'stories', 'bai-ze-ep01-input.json');
  const input = require(inputPath);

  logger.info('📥 已加载输入配置', {
    projectName: input.projectName,
    sceneCount: input.scenes?.length || 0
  });

  try {
    const result = await runWithRetry(input, {
      outputDir: path.join(__dirname, 'output'),
      outputKeyword: 'baize-ep01-preproduction',
      resultPrefix: 'baize-ep01-preproduction',
      reportPrefix: 'baize-ep01-preproduction-report',
      mode: 'nirath',
      projectConfig: {
        requiredCharacters: ['xiaoG', 'bai-ze'],
        isPreProduction: true,
        ownerApproved: true,
        beastId: 'bai-ze',
        beastName: '白泽',
        episodeTheme: '万物之灵'
      }
    });

    console.log('\n📁 结果文件：');
    console.log(`  JSON: ${result.jsonPath}`);
    console.log(`  MD:   ${result.mdPath}`);
    console.log(`  耗时: ${(result.totalDuration / 1000).toFixed(1)} 秒`);

    return result;
  } catch (err) {
    logger.error('预生产失败', { error: err.message });
    console.error('\n❌ 预生产失败:', err.message);
    process.exit(1);
  }
}

main();
