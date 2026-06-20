#!/usr/bin/env node
// 运行天狗定妆照生成（v2系统级模块）
const { execSync } = require('child_process');
const path = require('path');

const script = path.join(__dirname, 'character-portrait-generator.js');
const args = ['--mode', 'A', '--beast-id', 'tian-gou', '--type', 'beast'];

console.log('启动天狗定妆照生成（v2系统级模块）...');
console.log(`命令: node ${script} ${args.join(' ')}`);

try {
  execSync(`node ${script} ${args.join(' ')}`, {
    cwd: __dirname,
    stdio: 'inherit',
    timeout: 120000
  });
} catch (e) {
  console.error('生成失败:', e.message);
  process.exit(1);
}
