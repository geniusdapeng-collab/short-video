#!/usr/bin/env node
'use strict';

/**
 * run-baize-preproduction.js
 * 白泽 EP01 预生产启动器
 */

const path = require('path');
const { runPreproduction } = require('./systems/preproduction-service');
const { createLogger } = require('./systems/logger');

const logger = createLogger('baize-wrapper');

async function main() {
  logger.info('🎬 白泽 EP01 预生产启动（v6.5.58 Validator 修复验证）');

  const inputPath = path.join(__dirname, 'stories', 'bai-ze-ep01-input.json');
  const input = require(inputPath);

  logger.info('📥 已加载输入配置', {
    projectName: input.projectName,
    sceneCount: input.scenes?.length || 0
  });

  try {
    const result = await runPreproduction(input, {
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

    logger.info('✅ 预生产完成', {
      jsonPath: result.jsonPath,
      mdPath: result.mdPath,
      totalDuration: result.totalDuration
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
