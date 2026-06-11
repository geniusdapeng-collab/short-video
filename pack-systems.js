const fs = require('fs');
const path = require('path');

const SYSTEMS_DIR = '/root/.openclaw/workspace/systems';
const OUTPUT_FILE = '/root/.openclaw/workspace/output/zhuoyue-systems-v6.5.md';

function collectFiles(dir, base = '') {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = base ? path.join(base, entry.name) : entry.name;
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      files.push(...collectFiles(fullPath, relativePath));
    } else if (entry.name.endsWith('.js')) {
      files.push({ fullPath, relativePath });
    }
  }
  return files;
}

const files = collectFiles(SYSTEMS_DIR);
let md = '# 卓越系统 v6.5 全量代码\n\n';
md += '> 打包时间: ' + new Date().toISOString() + '\n';
md += '> 文件总数: ' + files.length + ' 个 JS 文件\n';
md += '> 总大小: ~3.9MB\n\n';
md += '---\n\n';

for (const file of files) {
  try {
    const content = fs.readFileSync(file.fullPath, 'utf8');
    md += '## ' + file.relativePath + '\n\n';
    md += '```javascript\n';
    md += content;
    md += '\n```\n\n';
    md += '---\n\n';
  } catch (e) {
    md += '## ' + file.relativePath + '\n\n[读取失败: ' + e.message + ']\n\n---\n\n';
  }
}

fs.writeFileSync(OUTPUT_FILE, md);
console.log('MD written: ' + OUTPUT_FILE);
console.log('Size: ' + (fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2) + ' MB');
console.log('Files: ' + files.length);
