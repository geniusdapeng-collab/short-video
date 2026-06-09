#!/usr/bin/env node
'use strict';

/**
 * run-taotie-preproduction.js
 * v6.4.1-rewrite: 薄 wrapper，调用统一入口 app/cli.js
 * 
 * 原逻辑已迁移至：
 *   - 输入配置：stories/taotie-ep01-input.json
 *   - 统一服务：systems/preproduction-service.js
 *   - 统一命令：app/commands/preproduction.js
 *   - 统一入口：app/cli.js
 */

const path = require('path');
const { runPreproduction } = require('./systems/preproduction-service');
const { createLogger } = require('./systems/logger');

const logger = createLogger('taotie-wrapper');

async function main() {
  logger.info('🎬 饕餮 EP01 预生产启动（wrapper 模式）');

  // 输入配置路径（支持环境变量覆盖）
  const inputPath = process.env.TAOTIE_INPUT_PATH || path.join(__dirname, 'stories', 'taotie-ep01-input.json');
  const input = require(inputPath);

  logger.info('📥 已加载输入配置', {
    projectName: input.projectName,
    sceneCount: input.scenes?.length || 0
  });

  try {
    const result = await runPreproduction(input, {
      outputDir: path.join(__dirname, 'output'),
      outputKeyword: 'taotie-ep01-preproduction',
      resultPrefix: 'taotie-ep01-preproduction',
      reportPrefix: 'taotie-ep01-preproduction-report',
      mode: 'nirath',
      projectConfig: {
        requiredCharacters: ['xiaoG', 'tao-tie'],
        isPreProduction: true,
        ownerApproved: true
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
