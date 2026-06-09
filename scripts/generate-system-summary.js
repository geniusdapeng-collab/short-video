'use strict';

const {
  buildReleaseSnapshot
} = require('../systems/release-manifest');

function run() {
  const snapshot = buildReleaseSnapshot(process.cwd());

  console.log('=== 系统摘要 ===');
  console.log(`名称: ${snapshot.systemName}`);
  console.log(`版本(manifest): ${snapshot.manifestVersion}`);
  console.log(`版本(current): ${snapshot.currentVersion || 'UNKNOWN'}`);
  console.log(`模式: ${snapshot.currentMode}`);
  console.log('');

  console.log('--- 入口 ---');
  for (const [name, relPath] of Object.entries(snapshot.entrypoints || {})) {
    console.log(`- ${name}: ${relPath}`);
  }
  console.log('');

  console.log('--- 核心配置 ---');
  for (const item of snapshot.coreConfigs || []) {
    console.log(`- ${item}`);
  }
  console.log('');

  console.log('--- 核心系统 ---');
  for (const item of snapshot.coreSystems || []) {
    console.log(`- ${item}`);
  }
  console.log('');

  console.log('--- Stage服务 ---');
  for (const item of snapshot.stageServices || []) {
    console.log(`- ${item}`);
  }
  console.log('');

  console.log('--- 关键能力 ---');
  for (const item of snapshot.keyCapabilities || []) {
    console.log(`- ${item}`);
  }
}

run();
